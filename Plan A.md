# Plan A: Virtual Reality (VR) Therapeutic Space
*Project Kolaborasi Psikologi & Teknologi*

Dokumen ini berisi rencana awal pengembangan UI dan penjelasan dasar seputar teknologi VR untuk membantu memahami langkah awal pengerjaan project.

---

## 1. Konsep Utama Aplikasi
Aplikasi ini dirancang sebagai ruang virtual interaktif di mana **Psikolog** dan **Pasien** dapat bertemu dan berkomunikasi secara real-time dari tempat yang berbeda menggunakan kacamata VR.

### Flow Pengguna (User Journey):
1. **Lobby (2D Web Page)**: User membuka halaman web di PC/Tablet/HP untuk memilih peran (Psikolog/Pasien), memasukkan nama, memilih avatar, menguji mikrofon, dan memilih tema ruangan (hanya psikolog yang bisa memilih tema ruangan).
2. **Virtual Room (3D VR World)**: Setelah menekan tombol "Enter VR", user mengenakan headset VR, lalu masuk ke dunia virtual 3D di mana mereka bisa melihat avatar satu sama lain, berbicara secara langsung (Voice Chat), dan berinteraksi.

---

## 2. Struktur Rencana UI (Langkah Awal)

### A. Lobby & Dashboard UI (2D Interface)
*   **Aesthetic**: Glassmorphism premium (efek kaca transparan) dengan warna-warna tenang seperti Teal, Indigo, dan Soft Pastel untuk memberikan efek psikologis yang menenangkan.
*   **Komponen**:
    *   **Role Selection Card**: Tombol interaktif untuk memilih "Masuk sebagai Psikolog" atau "Masuk sebagai Pasien".
    *   **Session Controller**: Input room code (misal: `PSY-123-ABC`) untuk menghubungkan psikolog dan pasien ke ruangan yang sama.
    *   **Environment Picker**: Pilihan visual 3D Room (misal: *Calm Beach*, *Forest Cabin*, *Modern Therapy Room*).
    *   **Device Status Panel**: Indikator apakah Microphone dan VR Headset sudah terdeteksi.

### B. In-VR UI (3D Spatial Interface)
*   **Aesthetic**: UI melayang (Spatial UI) di dalam dunia 3D yang bisa berinteraksi dengan laser pointer dari controller VR.
*   **Komponen**:
    *   **Therapist Control Panel** (Hanya untuk Psikolog):
        *   Mengganti musik latar/ambience (suara hujan, ombak, angin).
        *   Membuka papan tulis virtual (*Shared Board*) untuk menggambar atau menampilkan kartu terapi (misal: kartu emosi/TAT).
        *   Mengontrol durasi sesi (timer melayang).
    *   **Patient Expression Panel** (Untuk Pasien):
        *   Tombol reaksi cepat (emoji senang, cemas, sedih, tenang) untuk membantu pasien yang kesulitan mengekspresikan perasaannya lewat kata-kata.
    *   **Universal Settings**: Tombol Mute Mic dan tombol Exit Session.

---

## 3. Perbandingan Teknologi: WebXR vs Native VR (Unity/Unreal)

| Fitur | WebXR (A-Frame / Three.js) | Native VR (Unity / Unreal Engine) |
| :--- | :--- | :--- |
| **Media Berjalan** | Browser bawaan VR (Chrome, Oculus Browser, Safari) | Aplikasi terinstal (.apk di Quest/Pico, .exe di PC) |
| **Bahasa Coding** | HTML, CSS, JavaScript (Web Tech) | C# (Unity) atau C++ (Unreal) |
| **Aksesibilitas** | Sangat mudah. Tinggal buka link/URL, langsung jalan. | Butuh proses install (sideloading/store), download size besar. |
| **Kualitas Grafis** | Cukup/Sederhana (berbasis web mobile/headset) | Sangat Tinggi (kualitas game konsol/PC) |
| **Multiplayer / Audio** | Sangat mudah diintegrasikan dengan WebRTC/WebSockets. | Butuh plugin tambahan (Photon, Mirror, Vivox) yang lebih kompleks. |
| **Kemudahan Demo** | Tinggal hosting / jalankan server lokal. | Harus dicolok ke PC, build APK, pasang ke headset. |

---

## 4. Langkah Selanjutnya (Action Plan)
1. **Desain & Implementasi Lobby UI (2D)**: Membuat tampilan website lobby yang responsif dan estetik.
2. **Integrasi A-Frame (3D)**: Membuat template ruangan terapi 3D sederhana.
3. **Floating UI (Spatial UI)**: Menambahkan tombol melayang di dalam ruang 3D tersebut.
4. **Demo & Feedback**: Menunjukkan hasil UI ini ke dosen sebelum menambahkan fitur multiplayer/voice chat sesungguhnya.
