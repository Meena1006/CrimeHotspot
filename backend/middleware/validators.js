const { body } = require('express-validator');

exports.signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Officer']).withMessage('Role must be Admin or Officer'),
];

exports.loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.crimeValidation = [
  body('crimeType')
    .notEmpty()
    .isIn(['Theft', 'Vehicle Theft', 'Assault', 'Drug Crime', 'Cyber Crime', 'Robbery', 'Fraud'])
    .withMessage('Valid crime type is required'),
  body('locationName').trim().notEmpty().withMessage('Location is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('crimeDate').isISO8601().withMessage('Valid date is required'),
  body('crimeTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Time must be in HH:MM format'),
  body('severity')
    .notEmpty()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Valid severity is required'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('officerName').trim().notEmpty().withMessage('Officer name is required'),
];
