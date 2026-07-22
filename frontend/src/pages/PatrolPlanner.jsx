import { useCallback, useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { patrolService } from '../services/patrolService';
import PatrolForm from '../components/patrol/PatrolForm';
import PatrolMap from '../components/patrol/PatrolMap';
import LiveStats from '../components/patrol/LiveStats';
import ProgressCard from '../components/patrol/ProgressCard';
import PatrolTimeline from '../components/patrol/PatrolTimeline';
import IntermediateStopTable from '../components/patrol/IntermediateStopTable';
import RouteDetails from '../components/patrol/RouteDetails';
import AlternativeRoutes from '../components/patrol/AlternativeRoutes';
import FeasibilityWarning from '../components/patrol/FeasibilityWarning';
import PatrolDocumentation from '../components/patrol/PatrolDocumentation';
import PatrolHistory from '../components/patrol/PatrolHistory';

const today = () => new Date().toISOString().split('T')[0];

const PatrolPlanner = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    officerName: user?.name || '',
    officerId: user?.id || user?._id || '',
    patrolDate: today(),
    shift: 'Morning',
    fromLocation: '',
    toLocation: '',
    maxPatrolTime: 60,
    priorityMode: 'Balanced',
  });
  const [patrol, setPatrol] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [warning, setWarning] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [guardingOrder, setGuardingOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const locked = patrol?.status === 'active' || patrol?.status === 'completed';
  const completed = patrol?.status === 'completed';

  const loadLocations = useCallback(async () => {
    try {
      const res = await patrolService.getLocations();
      setLocations(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hotspot locations');
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await patrolService.getHistory({
        officerId: form.officerId || undefined,
      });
      setHistory(res.data.data || []);
    } catch {
      // non-blocking
    } finally {
      setHistoryLoading(false);
    }
  }, [form.officerId]);

  useEffect(() => {
    loadLocations();
    loadHistory();
  }, [loadLocations, loadHistory]);

  useEffect(() => {
    if (user?.name) {
      setForm((prev) => ({
        ...prev,
        officerName: prev.officerName || user.name,
        officerId: prev.officerId || user.id || user._id || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.officerName.trim() || !form.officerId.trim()) {
      setError('Officer name and ID are required.');
      return false;
    }
    if (!form.fromLocation || !form.toLocation) {
      setError('Select both From and To locations.');
      return false;
    }
    if (form.fromLocation === form.toLocation) {
      setError('From and To locations must be different.');
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    setAlternatives([]);
    setSelectedAlt(null);

    try {
      const res = await patrolService.generateRoute({
        ...form,
        maxPatrolTime: Number(form.maxPatrolTime),
      });

      if (!res.data.feasible) {
        setWarning(res.data.warning);
        setPatrol(null);
        return;
      }

      setPatrol(res.data.data);
      setSuccess('Patrol route generated. Review and lock when ready.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate route');
    } finally {
      setLoading(false);
    }
  };

  const handleAlternative = async () => {
    setError('');
    setSuccess('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      const res = await patrolService.generateAlternatives({
        fromLocation: form.fromLocation,
        toLocation: form.toLocation,
        maxPatrolTime: Number(form.maxPatrolTime),
        priorityMode: form.priorityMode,
        shift: form.shift,
        currentPathIds: patrol?.stops?.map(
          (s) => `area:${s.locationName}`
        ) || [],
      });

      if (!res.data.feasible) {
        setWarning(res.data.warning);
        return;
      }

      const alts = res.data.data || [];
      setAlternatives(alts);
      if (alts[0]) {
        setSelectedAlt(0);
        setPatrol((prev) => ({
          ...(prev || {}),
          ...alts[0],
          routeId: prev?.routeId || alts[0].routeId,
          officerName: form.officerName,
          officerId: form.officerId,
          patrolDate: form.patrolDate,
          shift: form.shift,
          fromLocation: form.fromLocation,
          toLocation: form.toLocation,
          priorityMode: form.priorityMode,
          maxPatrolTime: Number(form.maxPatrolTime),
          status: 'draft',
          generatedAt: new Date().toISOString(),
        }));
        setSuccess('Alternative routes ready — compare and select one.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate alternatives');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlt = (idx) => {
    const alt = alternatives[idx];
    if (!alt) return;
    setSelectedAlt(idx);
    setPatrol((prev) => ({
      ...prev,
      ...alt,
      routeId: prev?.routeId,
      officerName: form.officerName,
      officerId: form.officerId,
      patrolDate: form.patrolDate,
      shift: form.shift,
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      priorityMode: form.priorityMode,
      maxPatrolTime: Number(form.maxPatrolTime),
      status: 'draft',
    }));
  };

  const handleLock = async () => {
    if (!patrol) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...patrol,
        officerName: form.officerName,
        officerId: form.officerId,
        patrolDate: form.patrolDate,
        shift: form.shift,
        fromLocation: form.fromLocation,
        toLocation: form.toLocation,
        priorityMode: form.priorityMode,
        maxPatrolTime: Number(form.maxPatrolTime),
      };
      const res = await patrolService.lockPatrol(payload);
      setPatrol(res.data.data);
      setAlternatives([]);
      setSuccess('Patrol locked and ACTIVE. Mark stops as Guarded.');
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to lock patrol');
    } finally {
      setLoading(false);
    }
  };

  const handleGuard = async (stopOrder) => {
    if (!patrol || patrol.status !== 'active') return;
    setGuardingOrder(stopOrder);
    setError('');

    try {
      const id = patrol._id || patrol.routeId;
      const res = await patrolService.markGuarded(id, stopOrder);
      setPatrol(res.data.data);
      if (res.data.completed) {
        setSuccess('All locations guarded — PATROL COMPLETED.');
        loadHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark guarded');
    } finally {
      setGuardingOrder(null);
    }
  };

  const handleReset = () => {
    setPatrol(null);
    setAlternatives([]);
    setSelectedAlt(null);
    setWarning(null);
    setError('');
    setSuccess('');
    setForm((prev) => ({
      ...prev,
      fromLocation: '',
      toLocation: '',
      maxPatrolTime: 60,
      priorityMode: 'Balanced',
      patrolDate: today(),
    }));
  };

  const handleNewPatrol = () => {
    handleReset();
  };

  const handleOpenHistory = async (item) => {
    try {
      const res = await patrolService.getPatrol(item.routeId || item._id);
      const data = res.data.data;
      setPatrol(data);
      setForm((prev) => ({
        ...prev,
        officerName: data.officerName || prev.officerName,
        officerId: data.officerId || prev.officerId,
        patrolDate: data.patrolDate
          ? new Date(data.patrolDate).toISOString().split('T')[0]
          : prev.patrolDate,
        shift: data.shift || prev.shift,
        fromLocation: data.fromLocation || '',
        toLocation: data.toLocation || '',
        maxPatrolTime: data.maxPatrolTime || 60,
        priorityMode: data.priorityMode || 'Balanced',
      }));
      setAlternatives([]);
      setSuccess(`Loaded patrol ${data.routeId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open patrol');
    }
  };

  return (
    <div className="patrol-page">
      <div className="page-header patrol-page-header">
        <div>
          <h1>AI Patrol Planner</h1>
          <p>Optimized hotspot-aware patrol routing · OpenStreetMap · OSRM · DBSCAN</p>
        </div>
        {patrol?.status === 'active' && <span className="badge-active large">PATROL STATUS · ACTIVE</span>}
        {patrol?.status === 'completed' && <span className="badge-completed large">PATROL COMPLETED</span>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <LiveStats patrol={patrol} />

      <div className="patrol-workspace">
        <aside className="patrol-left">
          <PatrolForm
            form={form}
            locations={locations}
            onChange={handleChange}
            onGenerate={handleGenerate}
            onAlternative={handleAlternative}
            onLock={handleLock}
            onReset={handleReset}
            onNewPatrol={handleNewPatrol}
            loading={loading}
            locked={locked && !completed}
            completed={completed}
            hasRoute={Boolean(patrol?.stops?.length)}
            status={patrol?.status}
          />
          <ProgressCard patrol={patrol} />
          <PatrolTimeline stops={patrol?.stops || []} />
          <PatrolHistory history={history} onOpen={handleOpenHistory} loading={historyLoading} />
        </aside>

        <section className="patrol-right">
          <PatrolMap
            stops={patrol?.stops || []}
            geometry={patrol?.geometry || []}
            locked={patrol?.status === 'active'}
            onGuard={handleGuard}
            guardingOrder={guardingOrder}
          />
          <RouteDetails patrol={patrol} />
          <AlternativeRoutes
            alternatives={alternatives}
            selectedIndex={selectedAlt}
            onSelect={handleSelectAlt}
          />
        </section>
      </div>

      <div className="patrol-bottom">
        <IntermediateStopTable
          stops={patrol?.stops || []}
          locked={patrol?.status === 'active'}
          onGuard={handleGuard}
          guardingOrder={guardingOrder}
        />
        <PatrolDocumentation patrol={patrol} />
      </div>

      <FeasibilityWarning warning={warning} onClose={() => setWarning(null)} />
    </div>
  );
};

export default PatrolPlanner;
