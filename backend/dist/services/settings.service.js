"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const db_1 = require("../config/db");
const logger_1 = __importDefault(require("../utils/logger"));
const settings_types_1 = require("../types/settings.types");
const settings_validation_1 = require("../validations/settings.validation");
const xss_1 = __importDefault(require("xss"));
class SettingsService {
    // Get all settings (merged from DB)
    async getAllSettings() {
        try {
            const dbSettings = await db_1.prisma.systemSetting.findMany({
                where: { group: { in: ['general', 'business', 'payment', 'shipping', 'notifications', 'seo', 'security', 'admin', 'content'] } }
            });
            const flatSettings = {};
            dbSettings.forEach((setting) => {
                flatSettings[setting.key] = setting.value;
            });
            const nestedSettings = (0, settings_types_1.unflattenSettings)(flatSettings);
            return (0, settings_validation_1.validateAndTransformSettings)(nestedSettings);
        }
        catch (error) {
            logger_1.default.error('Failed to get settings', { error });
            // Return defaults on error
            return {
                general: { siteName: 'KingsQueens Collection', siteUrl: 'https://beautypro.com', siteEmail: 'admin@beautypro.com', logoUrl: '', faviconUrl: '' },
                business: { defaultCurrency: 'USD', taxRate: 0, defaultCountry: 'Kenya' },
                payment: { stripeEnabled: false, stripePublicKey: '', stripeSecretKey: '', mpesaEnabled: false, mpesaConsumerKey: '', mpesaConsumerSecret: '' },
                shipping: { freeShippingThreshold: 50, defaultShippingCost: 5.99, handlingFee: 2.99 },
                notifications: { emailNotifications: true, smsNotifications: false, pushNotifications: false, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' },
                seo: { metaTitle: 'KingsQueens Collection', metaDescription: 'World Fashion, Beauty & Body Care', keywords: 'fashion, beauty', googleAnalyticsId: '', facebookPixelId: '' },
                security: { rateLimitEnabled: true, maxLoginAttempts: 5, twoFactorEnabled: false },
                admin: { allowRegistration: true, requireEmailVerification: true },
                content: {
                    faqHeroImage: '',
                    faqHeroVideo: '',
                    contactHeroImage: '',
                    contactHeroVideo: '',
                    homeHeroImage: '',
                    homeHeroVideo: '',
                    aboutHeroImage: '',
                    aboutHeroVideo: '',
                    returnsHeroImage: '',
                    returnsHeroVideo: '',
                    returnsHeadline: '',
                    returnsDescription: '',
                    wellnessHeroImage: '',
                    wellnessHeroVideo: '',
                    wellnessHeadline: '',
                    wellnessDescription: '',
                    wellnessCtaLabel: '',
                    wellnessCtaHref: '',
                    translationOverrides: {},
                },
            };
        }
    }
    // Get single section settings
    async getSectionSettings(section) {
        const allSettings = await this.getAllSettings();
        const validSections = ['general', 'business', 'payment', 'shipping', 'notifications', 'seo', 'security', 'admin', 'content'];
        if (!validSections.includes(section)) {
            throw new Error(`Invalid section: ${section}`);
        }
        return allSettings[section];
    }
    // Update all settings
    async updateAllSettings(settingsData) {
        const validatedSettings = (0, settings_validation_1.validateAndTransformSettings)(settingsData);
        // Sanitize admin-provided HTML fields to prevent XSS
        try {
            if (validatedSettings?.content?.homeCustomHtml) {
                validatedSettings.content.homeCustomHtml = (0, xss_1.default)(validatedSettings.content.homeCustomHtml || '');
            }
        }
        catch (err) {
            logger_1.default.warn('Failed to sanitize homeCustomHtml', { err });
            if (validatedSettings?.content)
                validatedSettings.content.homeCustomHtml = '';
        }
        const flatSettings = (0, settings_types_1.flattenSettings)(validatedSettings);
        try {
            // Use upsert for each setting key (create if missing, update if exists)
            const upsertPromises = Object.entries(flatSettings).map(([key, value]) => {
                const [group] = key.split('.');
                return db_1.prisma.systemSetting.upsert({
                    where: { key },
                    update: { value, updatedAt: new Date() },
                    create: {
                        key,
                        value,
                        type: typeof value === 'object' ? 'json' : typeof value,
                        group: group,
                        description: `${group} settings - ${key}`,
                    },
                });
            });
            await db_1.prisma.$transaction(upsertPromises);
            logger_1.default.info('Settings updated successfully', { keysUpdated: Object.keys(flatSettings).length });
            return await this.getAllSettings(); // Return fresh data
        }
        catch (error) {
            logger_1.default.error('Failed to update settings', { error });
            throw error;
        }
    }
    // Update single section
    async updateSectionSettings(section, sectionData) {
        const allSettings = await this.getAllSettings();
        const validatedSection = (0, settings_validation_1.validateAndTransformSettings)({ [section]: sectionData })[section];
        // Sanitize HTML when updating content section
        try {
            if (section === 'content' && validatedSection?.homeCustomHtml) {
                validatedSection.homeCustomHtml = (0, xss_1.default)(validatedSection.homeCustomHtml || '');
            }
        }
        catch (err) {
            logger_1.default.warn('Failed to sanitize section homeCustomHtml', { err });
            if (validatedSection)
                validatedSection.homeCustomHtml = '';
        }
        const updatedSettings = { ...allSettings, [section]: validatedSection };
        return await this.updateAllSettings(updatedSettings);
    }
    // Get single setting by key (for granular access)
    async getSetting(key) {
        const setting = await db_1.prisma.systemSetting.findUnique({ where: { key } });
        return setting?.value;
    }
    // Reset to defaults
    async resetToDefaults() {
        const defaults = {
            general: { siteName: 'KingsQueens Collection', siteUrl: 'https://beautypro.com', siteEmail: 'admin@beautypro.com', logoUrl: '', faviconUrl: '' },
            business: { defaultCurrency: 'USD', taxRate: 0, defaultCountry: 'Kenya' },
            payment: { stripeEnabled: false, stripePublicKey: '', stripeSecretKey: '', mpesaEnabled: false, mpesaConsumerKey: '', mpesaConsumerSecret: '' },
            shipping: { freeShippingThreshold: 50, defaultShippingCost: 5.99, handlingFee: 2.99 },
            notifications: { emailNotifications: true, smsNotifications: false, pushNotifications: false, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' },
            seo: { metaTitle: 'KingsQueens Collection', metaDescription: 'World Fashion, Beauty & Body Care', keywords: 'fashion, beauty', googleAnalyticsId: '', facebookPixelId: '' },
            security: { rateLimitEnabled: true, maxLoginAttempts: 5, twoFactorEnabled: false },
            admin: { allowRegistration: true, requireEmailVerification: true },
            content: {
                faqHeroImage: '',
                faqHeroVideo: '',
                contactHeroImage: '',
                contactHeroVideo: '',
                homeHeroImage: '',
                homeHeroVideo: '',
                aboutHeroImage: '',
                aboutHeroVideo: '',
                returnsHeroImage: '',
                returnsHeroVideo: '',
                returnsHeadline: '',
                returnsDescription: '',
                wellnessHeroImage: '',
                wellnessHeroVideo: '',
                wellnessHeadline: '',
                wellnessDescription: '',
                wellnessCtaLabel: '',
                wellnessCtaHref: '',
                translationOverrides: {},
            },
        };
        return await this.updateAllSettings(defaults);
    }
}
exports.default = new SettingsService();
//# sourceMappingURL=settings.service.js.map