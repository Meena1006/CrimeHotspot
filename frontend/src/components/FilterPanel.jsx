import { useState } from 'react';

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

const LOCATIONS = [
  'T Nagar',
  'Velachery',
  'Anna Nagar',
  'Tambaram',
  'Adyar',
  'Porur',
  'Guindy',
  'Kodambakkam',
  'Perambur',
  'Royapuram',
  'Mylapore',
  'Ambattur',
  'Sholinganallur',
  'OMR',
  'Egmore',
];

const defaultFilters = {
  crimeType: '',
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
  severity: '',
  location: '',
};

const FilterPanel = ({ filters, onApply, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => onApply(localFilters);

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onReset();
  };

  return (
    <div className="filter-panel">
      <h3>Filters</h3>
      <div className="filter-grid">
        <div className="form-group">
          <label>Crime Type</label>
          <select name="crimeType" value={localFilters.crimeType} onChange={handleChange}>
            <option value="">All Types</option>
            {CRIME_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <select name="location" value={localFilters.location} onChange={handleChange}>
            <option value="">All Locations</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Severity</label>
          <select name="severity" value={localFilters.severity} onChange={handleChange}>
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date From</label>
          <input type="date" name="dateFrom" value={localFilters.dateFrom} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Date To</label>
          <input type="date" name="dateTo" value={localFilters.dateTo} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Time From</label>
          <input type="time" name="timeFrom" value={localFilters.timeFrom} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Time To</label>
          <input type="time" name="timeTo" value={localFilters.timeTo} onChange={handleChange} />
        </div>
      </div>

      <div className="filter-actions">
        <button className="btn btn-primary" onClick={handleApply}>
          Apply Filters
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
export { defaultFilters };
