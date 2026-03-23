import React from 'react';
import { FormTemplate } from '../types';
import { Printer, Layout, Type, Palette, FileText } from 'lucide-react';

interface TemplateDesignerProps {
  template: FormTemplate;
  onUpdate: (template: FormTemplate) => void;
  onClose: () => void;
  onSave: () => void;
}

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({ template, onUpdate, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 z-[110] flex bg-slate-100">
      {/* Sidebar Controls */}
      <div className="w-1/3 bg-white p-6 overflow-y-auto border-l shadow-xl">
        <h2 className="text-xl font-bold mb-6 border-b pb-4">مصمم القوالب</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Layout className="w-4 h-4" /> اسم القالب</label>
            <input type="text" value={template.name || ''} onChange={(e) => onUpdate({ ...template, name: e.target.value })} className="w-full p-2 border rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Printer className="w-4 h-4" /> حجم الورق</label>
            <select value={template.width} onChange={(e) => onUpdate({ ...template, width: e.target.value as any })} className="w-full p-2 border rounded-xl">
              <option value="80mm">80mm (حراري)</option>
              <option value="210mm">A4 (210mm)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Type className="w-4 h-4" /> حجم خط العنوان</label>
            <select value={template.headerFontSize} onChange={(e) => onUpdate({ ...template, headerFontSize: e.target.value as any })} className="w-full p-2 border rounded-xl">
              <option value="text-sm">صغير</option>
              <option value="text-base">متوسط</option>
              <option value="text-lg">كبير</option>
              <option value="text-xl">كبير جداً</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">عنوان الصيدلية</label>
            <input type="text" value={template.pharmacyAddress || ''} onChange={(e) => onUpdate({ ...template, pharmacyAddress: e.target.value })} className="w-full p-2 border rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Palette className="w-4 h-4" /> اللون الأساسي</label>
            <select value={template.primaryColor} onChange={(e) => onUpdate({ ...template, primaryColor: e.target.value })} className="w-full p-2 border rounded-xl">
              <option value="emerald-600">زمردي</option>
              <option value="blue-600">أزرق</option>
              <option value="rose-600">وردي</option>
              <option value="slate-800">أسود</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={template.showScientificName} onChange={(e) => onUpdate({ ...template, showScientificName: e.target.checked })} />
              إظهار الاسم العلمي
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={template.showBoxPrice} onChange={(e) => onUpdate({ ...template, showBoxPrice: e.target.checked })} />
              إظهار سعر العلبة
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={template.showPatientName} onChange={(e) => onUpdate({ ...template, showPatientName: e.target.checked })} />
              إظهار اسم المريض
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={template.showDoctorName} onChange={(e) => onUpdate({ ...template, showDoctorName: e.target.checked })} />
              إظهار اسم الطبيب
            </label>
          </div>
        </div>
        <div className="mt-8 flex gap-2">
          <button onClick={onSave} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold">حفظ</button>
          <button onClick={onClose} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-xl font-bold">إلغاء</button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex-1 p-8 overflow-y-auto flex justify-center">
        <div className={`bg-white shadow-2xl ${template.width === '80mm' ? 'w-[300px]' : 'w-[210mm]'} min-h-[400px] ${template.margin}`}>
          <div className={`text-center border-b pb-4 mb-4 text-${template.primaryColor}`}>
            <h1 className={`${template.headerFontSize} font-bold`}>{template.pharmacyName}</h1>
            <p className="text-sm">{template.pharmacyPhone}</p>
          </div>
          <div className="text-center text-sm text-slate-500">معاينة الفاتورة...</div>
        </div>
      </div>
    </div>
  );
};
