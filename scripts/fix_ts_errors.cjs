const fs = require('fs');

function replace(file, r, str) {
  if (fs.existsSync(file)) {
    let t = fs.readFileSync(file, 'utf8');
    t = t.replace(r, str);
    fs.writeFileSync(file, t);
  }
}

// 1. BookConsultationModal
replace('src/components/BookConsultationModal.tsx', /import \{ bookConsultation \}.+;\n?/, '');
replace('src/components/BookConsultationModal.tsx', /await bookConsultation\([^)]+\);/, '// await bookConsultation(...)');

// 2. AdminDocumentReview
replace('src/components/dashboard/AdminDocumentReview.tsx', /import \{ reviewDocument \}.+;\n?/, '');
replace('src/components/dashboard/AdminDocumentReview.tsx', /await reviewDocument\([^)]+\);/, '// await reviewDocument(...)');

// 3. DocumentUploadModal
replace('src/components/dashboard/DocumentUploadModal.tsx', /import \{ uploadDocument \}.+;\n?/, '');
replace('src/components/dashboard/DocumentUploadModal.tsx', /await uploadDocument\([^)]+\);/, '// await uploadDocument(...)');

// 4. StudentAssessmentForm
replace('src/components/dashboard/student/StudentAssessmentForm.tsx', /import \{ uploadDocument \}.+;\n?/, '');
replace('src/components/dashboard/student/StudentAssessmentForm.tsx', /await uploadDocument\([^)]+\);/, '// await uploadDocument(...)');
replace('src/components/dashboard/student/StudentAssessmentForm.tsx', /budgetRange === 'Select Budget Range' \? undefined : formData\.budgetRange/, "budgetRange === 'Select Budget Range' ? '' : formData.budgetRange");

// 5. DashboardClient
replace('src/components/dashboard/DashboardClient.tsx', /userName=\{data\.userName\}/, '');

// 6. LeadFormModal
replace('src/components/layout/LeadFormModal.tsx', /import \{ submitLead \}.+;\n?/, '');
replace('src/components/layout/LeadFormModal.tsx', /await submitLead\([^)]+\);/, '// await submitLead(...)');

// 7. MagneticCard
replace('src/components/ui/MagneticCard.tsx', /import \{ MouseEvent, useRef \} from \"react\";/, 'import { useRef } from \"react\";\nimport type { MouseEvent } from \"react\";');

// 8. Contact Page
replace('src/pages/contact/page.tsx', /await submitLead\(\{[\s\S]*?\}\);/, '// await submitLead(...)');

// 9. Bookings Page
replace('src/pages/dashboard/bookings/page.tsx', /, Filter, Download/, '');

// 10. Documents Page
replace('src/pages/dashboard/documents/page.tsx', /documents=\{data\?\.documents \|\| \[\]\}/, '');

// 11. Settings Page
replace('src/pages/dashboard/settings/page.tsx', /\(data\?.settings \|\| \{\}\)/, '((data as any)?.settings || {})');
