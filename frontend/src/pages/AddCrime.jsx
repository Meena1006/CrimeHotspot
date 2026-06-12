import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { crimeService } from '../services/crimeService';
import LoadingSpinner from '../components/LoadingSpinner';

const CRIME_TYPES = [
  'Theft',
  'Vehicle Theft',
  'Assault',
  'Drug Crime',
  'Cyber Crime',
  'Robbery',
  'Fraud',
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const LOCATIONS = {
  'T Nagar': { lat: 13.0418, lng: 80.2341 },
  Velachery: { lat: 12.9815, lng: 80.218 },
  'Anna Nagar': { lat: 13.085, lng: 80.2101 },
  Tambaram: { lat: 12.9249, lng: 80.1 },
  Adyar: { lat: 13.0067, lng: 80.2577 },
  Porur: { lat: 13.0358, lng: 80.1567 },
  Guindy: { lat: 13.0067, lng: 80.2206 },
  Kodambakkam: { lat: 13.051, lng: 80.223 },
  Perambur: { lat: 13.1143, lng: 80.235 },
  Royapuram: { lat: 13.1067, lng: 80.2967 },
  Mylapore: { lat: 13.0339, lng: 80.2619 },
  Ambattur: { lat: 13.1143, lng: 80.148 },
  Sholinganallur: { lat: 12.901, lng: 80.2279 },
  OMR: { lat: 12.9165, lng: 80.2369 },
  Egmore: { lat: 13.0732, lng: 80.2609 },
};

const AddCrime = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    crimeType: '',
    locationName: '',
    crimeDate: new Date().toISOString().split('T')[0],
    crimeTime: '',
    severity: '',
    description: '',
    officerName: user?.name || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const location = LOCATIONS[form.locationName];
    if (!location) {
      setError('Please select a valid location');
      setLoading(false);
      return;
    }

    try {
      await crimeService.addCrime({
        ...form,
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        crimeDate: new Date(form.crimeDate).toISOString(),
      });

      setSuccess('Crime report submitted successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/', { state: { refresh: true } }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit crime report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-crime-page">
      <header className="page-header">
        <div>
          <h1>Add Crime Report</h1>
          <p>Submit a new crime incident report</p>
        </div>
      </header>

      <div className="form-card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="crime-form">
          <div className="form-row">
            <div className="form-group">
              <label>Crime Type *</label>
              <select name="crimeType" value={form.crimeType} onChange={handleChange} required>
                <option value="">Select crime type</option>
                {CRIME_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <select name="locationName" value={form.locationName} onChange={handleChange} required>
                <option value="">Select location</option>
                {Object.keys(LOCATIONS).map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="crimeDate"
                value={form.crimeDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Time *</label>
              <input
                type="time"
                name="crimeTime"
                value={form.crimeTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Severity *</label>
              <select name="severity" value={form.severity} onChange={handleChange} required>
                <option value="">Select severity</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Short Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the incident (minimum 10 characters)"
              rows={4}
              required
              minLength={10}
            />
          </div>

          <div className="form-group">
            <label>Officer Name *</label>
            <input
              type="text"
              name="officerName"
              value={form.officerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Submit Report'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCrime;
