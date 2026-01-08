const express = require('express');
const router = express.Router();
const localizationController = require('../controllers/localization.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get supported languages
router.get('/languages', localizationController.getSupportedLanguages);

// Get supported currencies
router.get('/currencies', localizationController.getSupportedCurrencies);

// Get supported timezones
router.get('/timezones', localizationController.getSupportedTimezones);

// Get supported countries
router.get('/countries', localizationController.getSupportedCountries);

// Get translations for a language
router.get('/translations/:language', localizationController.getTranslations);

// Get localized date/time formats
router.get('/formats/:country', localizationController.getFormats);

// Convert currency
router.post('/currency/convert', localizationController.convertCurrency);

// Get tax rates by country
router.get('/tax-rates/:country', localizationController.getTaxRates);

// Get business regulations by country
router.get('/regulations/:country', localizationController.getRegulations);

module.exports = router;
