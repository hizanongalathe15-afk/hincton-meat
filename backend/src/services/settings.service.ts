// @ts-nocheck
import { prisma } from '../config/db';
import logger from '../utils/logger';
import {
  settingsSchema,
  SettingsFormData,
  SystemSetting,
  flattenSettings,
  unflattenSettings
} from '../types/settings.types';
import { validateAndTransformSettings, getValidationErrors } from '../validations/settings.validation';
import { ZodError } from 'zod';
import xss from 'xss';

class SettingsService {
  // Get all settings (merged from DB)
  async getAllSettings(): Promise<SettingsFormData> {
    try {
      const dbSettings = await prisma.systemSetting.findMany({
        where: { group: { in: ['general', 'business', 'payment', 'shipping', 'notifications', 'seo', 'security', 'admin', 'content'] } }
      });

      const flatSettings: Record<string, any> = {};
      dbSettings.forEach((setting) => {
        flatSettings[setting.key] = setting.value;
      });

      const nestedSettings = unflattenSettings(flatSettings);
      return validateAndTransformSettings(nestedSettings);
    } catch (error) {
      logger.error('Failed to get settings', { error });
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
  async getSectionSettings(section: string): Promise<any> {
    const allSettings = await this.getAllSettings();
    const validSections = ['general', 'business', 'payment', 'shipping', 'notifications', 'seo', 'security', 'admin', 'content'] as const;
    
    if (!validSections.includes(section as any)) {
      throw new Error(`Invalid section: ${section}`);
    }

    return allSettings[section as keyof SettingsFormData];
  }

  // Update all settings
  async updateAllSettings(settingsData: unknown): Promise<SettingsFormData> {
    const validatedSettings = validateAndTransformSettings(settingsData);
    // Sanitize admin-provided HTML fields to prevent XSS
    try {
      if ((validatedSettings as any)?.content?.homeCustomHtml) {
        (validatedSettings as any).content.homeCustomHtml = xss((validatedSettings as any).content.homeCustomHtml || '');
      }
    } catch (err) {
      logger.warn('Failed to sanitize homeCustomHtml', { err });
      if ((validatedSettings as any)?.content) (validatedSettings as any).content.homeCustomHtml = '';
    }

    const flatSettings = flattenSettings(validatedSettings);

    try {
      // Use upsert for each setting key (create if missing, update if exists)
      const upsertPromises = Object.entries(flatSettings).map(([key, value]) => {
        const [group] = key.split('.');
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value, updatedAt: new Date() },
          create: {
            key,
            value,
            type: typeof value === 'object' ? 'json' : typeof value as any,
            group: group as any,
            description: `${group} settings - ${key}`,
          },
        });
      });

      await prisma.$transaction(upsertPromises);
      logger.info('Settings updated successfully', { keysUpdated: Object.keys(flatSettings).length });

      return await this.getAllSettings(); // Return fresh data
    } catch (error) {
      logger.error('Failed to update settings', { error });
      throw error;
    }
  }

  // Update single section
  async updateSectionSettings(section: string, sectionData: unknown): Promise<any> {
    const allSettings = await this.getAllSettings();
    const validatedSection = validateAndTransformSettings({ [section]: sectionData })[section as keyof SettingsFormData]!;
    // Sanitize HTML when updating content section
    try {
      if (section === 'content' && (validatedSection as any)?.homeCustomHtml) {
        (validatedSection as any).homeCustomHtml = xss((validatedSection as any).homeCustomHtml || '');
      }
    } catch (err) {
      logger.warn('Failed to sanitize section homeCustomHtml', { err });
      if ((validatedSection as any)) (validatedSection as any).homeCustomHtml = '';
    }

    const updatedSettings = { ...allSettings, [section]: validatedSection } as SettingsFormData;
    return await this.updateAllSettings(updatedSettings);
  }

  // Get single setting by key (for granular access)
  async getSetting(key: string): Promise<any> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value;
  }

  // Reset to defaults
  async resetToDefaults(): Promise<SettingsFormData> {
    const defaults: SettingsFormData = {
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

export default new SettingsService();
