# Rencana Penyempurnaan Animasi Menyeluruh (Soft Spring & Organic Inertia)

Sesuai instruksi dan pilihan Anda, rencana ini berfokus **100% pada penyempurnaan (polishing) tanpa merombak konsep atau bentuk animasi yang sudah ada**. Seluruh koreografi asli di 7 chapter tetap dipertahankan, namun diperhalus menggunakan fisika **Soft Spring dengan sedikit inertia organik** (ayunan lembut, deselerasi elastis yang natural, dan transisi bebas patah-patah).

---

## 1. Fondasi Fisika Gerak (`src/utils/motionMath.ts`)
- **Penambahan `stepUnderdampedSpring` & `stepSpringVector2D`**:
  - Menambahkan solver pegas harmonik teredam lembut (*soft underdamped spring* dengan rasio redaman $\zeta \approx 0.72 - 0.78$) yang memberikan efek *organic follow-through* (sedikit mengayun halus sebelum berhenti sempurna) tanpa bergetar berlebihan.
- **Penyempurnaan Kurva Easing Scroll (`quinticOut` & `softSpringEase`)**:
  - Memperhalus fungsi interpolasi pada `computeScrollTransform`, `computeChapterEntranceMetrics`, dan `computeIntroExitPortalMetrics` agar perubahan skala, rotasi, dan *stroke-dashoffset* mengalir lebih luwes saat scroll melambat.
- **Penyelarasan Velocity-Governed Damping (`src/App.tsx`)**:
  - Menambahkan sedikit *scroll momentum carry* (inertia lembut) pada nilai `smoothScrollY` dan `sectionProgress` agar saat pengguna berhenti melakukan scroll, animasi meluncur berhenti secara organik seperti pegas lembut.

---

## 2. Penyempurnaan di Seluruh 7 Chapter (Tanpa Mengubah Desain/Konsep)

### Chapter 01 — `#intro` (`src/components/IntroSection.tsx`)
- **Pointer Spotlight & Tilt dengan Soft Spring Inertia**:
  - Mengubah pelacakan kursor yang sebelumnya instan menjadi digerakkan oleh loop pegas 2D (`stepSpringVector2D`), sehingga cahaya *spotlight*, pergeseran kata (`WORD`), dan kemiringan 3D (*perspective tilt*) mengayun lembut mengikuti kursor dan kembali ke titik tengah secara elastis saat kursor keluar.
- **Exit Portal Conduit**:
  - Memperhalus interpolasi *headline split* dan *frame inset* saat transisi menuju Chapter 02.

### Chapter 02 — `#identity` (`src/components/IdentitySection.tsx`)
- **Pernyataan Tipografi Scroll-Driven (`IDEAS` → `EXECUTION`)**:
  - Menambahkan *soft spring smoothing* pada transisi *scale*, *rotation*, dan *translateY* di tiap kata kunci agar pergerakannya terasa berayun lembut mengikuti ritme scroll.
- **Simulasi Jaringan Node (`stepSpringNode2D`)**:
  - Menyesuaikan parameter *stiffness* dan *damping* pada node blueprint agar pantulan saat disentuh kursor terasa lebih kenyal, organik, dan saling terhubung secara fluida.

### Chapter 03 — `#work` (`src/components/WorkSection.tsx` & `src/components/ProjectVisualStage.tsx`)
- **Horizontal Spatial Gallery dengan Organic Spring**:
  - Mengganti pergeseran linier panggung dengan *soft spring damper* sehingga perpindahan antar kelima proyek (`Silent Road` hingga `Experiments`) memiliki sedikit *overshoot* dan *settle* yang elegan tanpa pernah berkedip atau *black screen*.
- **Responsivitas Kanvas Simulasi 60fps**:
  - Memperhalus interpolasi posisi kursor di dalam kelima kanvas simulasi proyek agar gelombang, partikel, dan vektor merespons gerakan tangan dengan keluwesan ekstra.

### Chapter 04 — `#lab` (`src/components/ExperimentSection.tsx`)
- **Kanvas Eksperimen 001–009**:
  - Menambahkan *pointer velocity smoothing* dan peluruhan inersia yang lebih lembut pada kesembilan kanvas laboratorium digital agar interaksi tarikan/dorongan kursor meninggalkan ayunan fisika yang lebih panjang dan memuaskan.
- **Transisi Kartu & Filter Kategori**:
  - Memperhalus *micro-interaction* hover dan kurva pegas saat memilih atau menginspeksi modul eksperimen.

### Chapter 05 — `#process` (`src/components/ProcessSection.tsx`)
- **6-Stage Pipeline (`01 IDEA` → `06 SHIP`)**:
  - Menambahkan pegas lembut pada progres morfologi kanvas (`morphProgress`) dan indikator tahap aktif agar saat pengguna berpindah tahap (baik lewat scroll maupun klik tombol tahap), geometri blueprint bertransformasi dengan ayunan elastis.

### Chapter 06 — `#about` (`src/components/AboutSection.tsx` & `src/components/ProfileDisciplineGraphic.tsx`)
- **Grafik Disiplin & Trajektori Blueprint**:
  - Memperhalus pegas sudut (`stepAngleSpring`) dan respons paralaks pada grafik interaktif serta kartu domain kapabilitas agar bergerak dengan inersia lembut saat kursor melintas.

### Chapter 07 — `#ending` (`src/components/FooterEnding.tsx` & `src/components/EpilogueMotionGraphic.tsx`)
- **Tombol Kontak Magnetik & Epilogue Ring**:
  - Mengganti posisi magnetik statis pada tombol kontak dengan animasi pegas 2D (`stepSpringVector2D`), sehingga saat kursor mendekat atau lepas dari tombol, tombol tertarik dan memantul kembali dengan ayunan *soft spring* yang halus.
  - Memperhalus rotasi cincin konvergensi SVG pada `EpilogueMotionGraphic`.

---

## 3. Elemen Global (`CustomCursor.tsx`, `Navigation.tsx`, `ChapterEntrancePortal.tsx`)
- **`CustomCursor.tsx`**: Menyesuaikan pegas cincin luar kursor agar memiliki sedikit *elastic follow-through* saat berhenti atau saat membesar di atas elemen interaktif.
- **`ChapterEntrancePortal.tsx`**: Memperhalus kurva *clip-path* dan tarikan garis blueprint di pintu masuk tiap chapter dengan pegas lembut.
- **`Navigation.tsx`**: Memperhalus transisi indikator chapter aktif dan *progress bar* menggunakan kurva `cubic-bezier(0.22, 1, 0.36, 1)` yang selaras dengan nuansa pegas organik.
