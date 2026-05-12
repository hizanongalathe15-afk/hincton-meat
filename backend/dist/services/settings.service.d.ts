import { SettingsFormData } from '../types/settings.types';
declare class SettingsService {
    getAllSettings(): Promise<SettingsFormData>;
    getSectionSettings(section: string): Promise<any>;
    updateAllSettings(settingsData: unknown): Promise<SettingsFormData>;
    updateSectionSettings(section: string, sectionData: unknown): Promise<any>;
    getSetting(key: string): Promise<any>;
    resetToDefaults(): Promise<SettingsFormData>;
}
declare const _default: SettingsService;
export default _default;
//# sourceMappingURL=settings.service.d.ts.map