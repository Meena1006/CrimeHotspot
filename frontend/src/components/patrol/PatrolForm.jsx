const PRIORITY_MODES = [
  'Shortest Route',
  'Highest Risk Areas',
  'Balanced',
  'Maximum Coverage',
];

const MAX_TIMES = [30, 45, 60, 90, 120];
const SHIFTS = ['Morning', 'Afternoon', 'Night'];

const PatrolForm = ({
  form,
  locations,
  onChange,
  onGenerate,
  onAlternative,
  onLock,
  onReset,
  onNewPatrol,
  loading,
  locked,
  completed,
  hasRoute,
  status,
}) => {
  const disabledEdit = locked || loading;

  return (
    <div className="patrol-panel patrol-form-panel">
      <div className="patrol-panel-header">
        <h2>Patrol Planning</h2>
        {status === 'active' && <span className="badge-active">ACTIVE</span>}
        {status === 'completed' && <span className="badge-completed">COMPLETED</span>}
        {status === 'draft' && hasRoute && <span className="badge-draft">DRAFT</span>}
      </div>

      <div className="patrol-form-fields">
        <div className="form-group">
          <label htmlFor="officerName">Officer Name</label>
          <input
            id="officerName"
            name="officerName"
            value={form.officerName}
            onChange={onChange}
            disabled={disabledEdit}
            placeholder="Inspector Name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="officerId">Officer ID</label>
          <input
            id="officerId"
            name="officerId"
            value={form.officerId}
            onChange={onChange}
            disabled={disabledEdit}
            placeholder="e.g. OFF-1042"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="patrolDate">Patrol Date</label>
            <input
              id="patrolDate"
              type="date"
              name="patrolDate"
              value={form.patrolDate}
              onChange={onChange}
              disabled={disabledEdit}
            />
          </div>
          <div className="form-group">
            <label htmlFor="shift">Patrol Shift</label>
            <select
              id="shift"
              name="shift"
              value={form.shift}
              onChange={onChange}
              disabled={disabledEdit}
            >
              {SHIFTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="fromLocation">From Location</label>
          <select
            id="fromLocation"
            name="fromLocation"
            value={form.fromLocation}
            onChange={onChange}
            disabled={disabledEdit}
          >
            <option value="">Select start hotspot</option>
            {locations.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name} ({loc.riskLevel} · {loc.crimeCount} crimes)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="toLocation">To Location</label>
          <select
            id="toLocation"
            name="toLocation"
            value={form.toLocation}
            onChange={onChange}
            disabled={disabledEdit}
          >
            <option value="">Select destination</option>
            {locations.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name} ({loc.riskLevel} · {loc.crimeCount} crimes)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="maxPatrolTime">Maximum Patrol Time</label>
          <select
            id="maxPatrolTime"
            name="maxPatrolTime"
            value={form.maxPatrolTime}
            onChange={onChange}
            disabled={disabledEdit}
          >
            {MAX_TIMES.map((t) => (
              <option key={t} value={t}>{t} Minutes</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priorityMode">Priority Mode</label>
          <select
            id="priorityMode"
            name="priorityMode"
            value={form.priorityMode}
            onChange={onChange}
            disabled={disabledEdit}
          >
            {PRIORITY_MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="patrol-form-actions">
        {!locked && !completed && (
          <>
            <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate Route'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onAlternative}
              disabled={loading || !hasRoute}
            >
              Generate Alternative Route
            </button>
            <button
              type="button"
              className="btn btn-lock"
              onClick={onLock}
              disabled={loading || !hasRoute}
            >
              Lock Patrol
            </button>
            <button type="button" className="btn btn-secondary" onClick={onReset} disabled={loading}>
              Reset
            </button>
          </>
        )}

        {locked && !completed && (
          <p className="patrol-lock-hint">
            Patrol is locked. Mark each stop as <strong>Guarded</strong> on the map.
          </p>
        )}

        {completed && (
          <button type="button" className="btn btn-primary" onClick={onNewPatrol}>
            Generate New Patrol
          </button>
        )}
      </div>
    </div>
  );
};

export default PatrolForm;
