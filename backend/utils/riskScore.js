const SEVERITY_SCORE = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/**
 * Compute composite risk score and level for a hotspot/cluster.
 */
const computeRisk = ({ crimeCount = 0, severities = [], dates = [] }) => {
  const avgSeverity =
    severities.length > 0
      ? severities.reduce((a, b) => a + b, 0) / severities.length
      : 1;

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const recentCrimes = dates.filter((d) => now - new Date(d).getTime() <= thirtyDays).length;
  const recentRatio = crimeCount > 0 ? recentCrimes / crimeCount : 0;

  // Frequency: crimes per month over observed span (cap at 1 year)
  const frequency = crimeCount / 6; // normalize against ~6 month window

  const riskScore =
    crimeCount * 1.5 +
    avgSeverity * 8 +
    recentCrimes * 2.5 +
    recentRatio * 10 +
    frequency * 3;

  let riskLevel = 'Low';
  if (riskScore >= 55 || (crimeCount >= 15 && avgSeverity >= 2.5)) riskLevel = 'High';
  else if (riskScore >= 28 || crimeCount >= 8) riskLevel = 'Medium';

  return {
    riskScore: Math.round(riskScore * 10) / 10,
    riskLevel,
    crimeCount,
    avgSeverity: Math.round(avgSeverity * 100) / 100,
    recentCrimes,
    frequency: Math.round(frequency * 100) / 100,
  };
};

const severityToNumber = (severity) => SEVERITY_SCORE[severity] || 1;

module.exports = { computeRisk, severityToNumber, SEVERITY_SCORE };
