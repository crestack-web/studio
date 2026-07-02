// ═══════════════════════════════════════════
//  BUSMO — Document Templates Export
// ═══════════════════════════════════════════

export { ModernCorporateTemplate } from './ModernCorporateTemplate';
export { NigerianWholesaleTemplate } from './NigerianWholesaleTemplate';
export { CompactA5Template } from './CompactA5Template';
export { ThermalReceiptTemplate } from './ThermalReceiptTemplate';

import { ModernCorporateTemplate } from './ModernCorporateTemplate';
import { NigerianWholesaleTemplate } from './NigerianWholesaleTemplate';
import { CompactA5Template } from './CompactA5Template';
import { ThermalReceiptTemplate } from './ThermalReceiptTemplate';
import { DocumentTemplate, TemplateStyle } from '../types';

export const TEMPLATE_COMPONENTS: Record<TemplateStyle, React.FC<{ template: DocumentTemplate; data: any }>> = {
  'modern-corporate': ModernCorporateTemplate,
  'nigerian-wholesale': NigerianWholesaleTemplate,
  'compact-a5': CompactA5Template,
  'thermal-receipt': ThermalReceiptTemplate,
};

export function getTemplateComponent(style: TemplateStyle) {
  return TEMPLATE_COMPONENTS[style] || ModernCorporateTemplate;
}