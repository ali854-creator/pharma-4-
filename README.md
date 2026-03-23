# نظام صيدلية (Pharmacy Management System)

تطبيق Flask بسيط لإدارة الصيدلية:
- إدارة الأدوية ( Inventory )
- نظام مبيعات (POS)
- إدارة الوصفات الطبية
- جرد المخزون
- تقارير ومحاسبة
- إدارة المستخدمين وصلاحيات

## متطلبات

- Python 3.11+ (أو 3.10)
- مكتبات:
  - Flask
  - Flask-Login
  - Flask-SQLAlchemy
  - Werkzeug

## التشغيل

```bash
cd "c:\Users\Ali\Desktop\pharma 3"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

أو ببساطة بالضغط مزدوجًا على `run.bat`.

افتح المتصفح:
- `http://127.0.0.1:5000` (محلي)
- أو `http://<عنوان_IP>:5000` للوصول من أجهزة أخرى

حساب إفتراضي:
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

## أهم المسارات

- `/` لوحة التحكم
- `/drugs` إدارة الأدوية
- `/drugs/add` إضافة دواء
- `/sales` نظام البيع
- `/prescriptions` الوصفات
- `/stock_audit` الجرد
- `/reports` التقارير
- `/suppliers` الموردين
- `/users` إدارة المستخدمين (admin فقط)

## ملاحظات

- إن واجهت خطأ متعلقة بـ"barcode" أو حقل مكرر، تأكد أن `barcode` لا يتكرر في نفس الدواء.
- التطبيق يستخدم قاعدة SQLite محلية `pharmacy.db` في نفس المجلد.
- نسخ احتياطي: اضغط `نسخ احتياطي` من القائمة لتحميل DB.
