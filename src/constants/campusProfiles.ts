import type { StudentKampus } from '../types/campus'

export interface CampusProfileInfo {
  campusKey: StudentKampus
  officialName: string
  address: string
  pic: string
  phone: string
}

/**
 * Data Resmi Kontak & Alamat Seluruh Kampus Pondok Modern Darussalam Gontor
 * Sumber: https://gontor.ac.id/kontak-alamat/
 */
export const OFFICIAL_CAMPUS_PROFILES: Record<StudentKampus, CampusProfileInfo> = {
  'Gontor 1': {
    campusKey: 'Gontor 1',
    officialName: 'Pondok Modern Darussalam Gontor Kampus Pusat (Gontor 1)',
    address: 'Ds. Gontor, Kec. Mlarak, Kab. Ponorogo, Prov. Jawa Timur, 63472',
    pic: 'Sekretariat Pimpinan PMDG Pusat',
    phone: '(0352) 311766 / WA: +62 851-7512-1926',
  },
  'Gontor 2': {
    campusKey: 'Gontor 2',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 2',
    address: 'Jl. Raya Pacitan-Ponorogo, Ds. Madusari, Kec. Siman, Kab. Ponorogo, Prov. Jawa Timur, 63471',
    pic: 'Pengasuh PMDG Kampus 2',
    phone: '(0352) 488557',
  },
  'Gontor 3': {
    campusKey: 'Gontor 3',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 3 (Darul Ma\'rifat)',
    address: 'Ds. Sumbercangkring, Kec. Gurah, Kab. Kediri, Prov. Jawa Timur, 64181',
    pic: 'Pengasuh PMDG Kampus 3',
    phone: '0812-3347-2935 / 0851-8681-9261',
  },
  'Gontor 4': {
    campusKey: 'Gontor 4',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 4 (Darul Muttaqin)',
    address: 'Jl. Bomo, Ds. Kaligung, Kec. Blimbingsari, Kab. Banyuwangi, Prov. Jawa Timur, 68462',
    pic: 'Pengasuh PMDG Kampus 4',
    phone: '0852-3205-4688',
  },
  'Gontor 5': {
    campusKey: 'Gontor 5',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 5 (Darul Qiyam)',
    address: 'Dsn. Gadingsari, Ds. Mangunsari, Kec. Sawangan, Kab. Magelang, Prov. Jawa Tengah, 56481',
    pic: 'Pengasuh PMDG Kampus 5',
    phone: '0821-3255-1629',
  },
  'Gontor 6': {
    campusKey: 'Gontor 6',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 6 (Riyadhatul Mujahidin)',
    address: 'Jl. Mowila-Baito, Ds. Pudahoa, Kec. Mowila, Kab. Konawe Selatan, Prov. Sulawesi Tenggara, 93879',
    pic: 'Pengasuh PMDG Kampus 6',
    phone: '0812-4115-9760',
  },
  'Gontor 7': {
    campusKey: 'Gontor 7',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 7',
    address: 'Dsn. Kubu Panglima, Ds. Tajimalela, Kec. Kalianda, Kab. Lampung Selatan, Prov. Lampung, 35551',
    pic: 'Pengasuh PMDG Kampus 7',
    phone: '0878-1866-4566 / 0812-9085-9527',
  },
  'Gontor 8': {
    campusKey: 'Gontor 8',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 8 (Darul Amin)',
    address: 'Jl. Raya B. Aceh-Medan KM. 47,5, Ds. Meunasah Baro, Kec. Seulimeum, Kab. Aceh Besar, Prov. Nanggroe Aceh Darussalam, 23951',
    pic: 'Pengasuh PMDG Kampus 8',
    phone: '0853-2030-1991 / 0812-1769-5759',
  },
  'Gontor 9': {
    campusKey: 'Gontor 9',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 9',
    address: 'Bukit Mandi Mandian, Dsn. Ompang, Jorong Talago Laweh, Ds. Sulit Air, Kec. X Koto Diatas, Kab. Solok, Prov. Sumatera Barat, 27355',
    pic: 'Pengasuh PMDG Kampus 9',
    phone: '0812-6846-3467',
  },
  'Gontor 10': {
    campusKey: 'Gontor 10',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 10',
    address: 'Ds. Parit Culum 1, Kec. Muara Sabak Barat, Kab. Tanjung Jabung Timur, Prov. Jambi, 36761',
    pic: 'Pengasuh PMDG Kampus 10',
    phone: '0821-7042-6698',
  },
  'Gontor 11': {
    campusKey: 'Gontor 11',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 11 (Ittihadul Ummah)',
    address: 'Jl. Trans Sulawesi, Ds. Tokorondo, Kec. Poso Pesisir, Kab. Poso, Prov. Sulawesi Tengah, 94652',
    pic: 'Pengasuh PMDG Kampus 11',
    phone: '0821-9514-8834',
  },
  'Gontor 12': {
    campusKey: 'Gontor 12',
    officialName: 'Pondok Modern Darussalam Gontor Kampus 12',
    address: 'Ds. Lubuk Jering, Kec. Sungai Mandau, Kab. Siak, Prov. Riau, 28671',
    pic: 'Pengasuh PMDG Kampus 12',
    phone: '0852-7282-2990',
  },
  'Gontor Putri 1': {
    campusKey: 'Gontor Putri 1',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 1',
    address: 'Ds. Sambirejo, Kec. Mantingan, Kab. Ngawi, Prov. Jawa Timur, 63257',
    pic: 'Pengasuh PMDG Putri Kampus 1',
    phone: '(0351) 671123 / WA: 0821-3946-3304',
  },
  'Gontor Putri 2': {
    campusKey: 'Gontor Putri 2',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 2',
    address: 'Ds. Sambirejo, RT.003/RW.007, Kec. Mantingan, Kab. Ngawi, Prov. Jawa Timur, 63257',
    pic: 'Pengasuh PMDG Putri Kampus 2',
    phone: '(0351) 674293 / WA: 0823-3422-3174',
  },
  'Gontor Putri 3': {
    campusKey: 'Gontor Putri 3',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 3',
    address: 'Ds. Karangbanyu, Kec. Widodaren, Kab. Ngawi, Prov. Jawa Timur, 63257',
    pic: 'Pengasuh PMDG Putri Kampus 3',
    phone: '0822-5715-0059',
  },
  'Gontor Putri 4': {
    campusKey: 'Gontor Putri 4',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 4',
    address: 'Dsn. Bobosan, Ds. Kemiri, Kec. Kandangan, Kab. Kediri, Prov. Jawa Timur, 64294',
    pic: 'Pengasuh PMDG Putri Kampus 4',
    phone: '0813-7337-8535',
  },
  'Gontor Putri 5': {
    campusKey: 'Gontor Putri 5',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 5',
    address: 'Ds. Lamomea, Kec. Konda, Kab. Konawe Selatan, Prov. Sulawesi Tenggara, 93871',
    pic: 'Pengasuh PMDG Putri Kampus 5',
    phone: '0853-2088-1750',
  },
  'Gontor Putri 6': {
    campusKey: 'Gontor Putri 6',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 6',
    address: 'Jl. Trans Sulawesi, Ds. Tokorondo, Kec. Poso Pesisir, Kab. Poso, Prov. Sulawesi Tengah, 94652',
    pic: 'Pengasuh PMDG Putri Kampus 6',
    phone: '0813-4384-0169 / 0822-4640-7551',
  },
  'Gontor Putri 7': {
    campusKey: 'Gontor Putri 7',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 7',
    address: 'Jl. Raya Pekanbaru-Bangkinang KM. 21, Ds. Rimbo Panjang, Kec. Tambang, Kab. Kampar, Prov. Riau, 28462',
    pic: 'Pengasuh PMDG Putri Kampus 7',
    phone: '0811-7686-707',
  },
  'Gontor Putri 8': {
    campusKey: 'Gontor Putri 8',
    officialName: 'Pondok Modern Darussalam Gontor Putri Kampus 8',
    address: 'Jl. A. Rahman, Ds. Labuhan Ratu VI, Kec. Labuhan Ratu, Kab. Lampung Timur, Prov. Lampung, 34375',
    pic: 'Pengasuh PMDG Putri Kampus 8',
    phone: '0812-7814-1474 / 0812-7814-1774',
  },
}

export const CAMPUS_STORAGE_KEY = 'ogsoreg_institution_settings_v1'

/**
 * Mengambil data profil kampus (memeriksa localStorage terlebih dahulu untuk custom override,
 * atau kembali ke data default resmi).
 */
export function getSavedCampusProfile(campusKey: StudentKampus): CampusProfileInfo {
  try {
    const raw = localStorage.getItem(`${CAMPUS_STORAGE_KEY}_${campusKey}`)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CampusProfileInfo>
      return {
        ...OFFICIAL_CAMPUS_PROFILES[campusKey],
        ...parsed,
      }
    }
  } catch {
    // Fallback to default
  }
  return OFFICIAL_CAMPUS_PROFILES[campusKey]
}

/**
 * Menyimpan data profil kampus yang diperbarui ke localStorage
 */
export function saveCampusProfile(profile: CampusProfileInfo): void {
  try {
    localStorage.setItem(`${CAMPUS_STORAGE_KEY}_${profile.campusKey}`, JSON.stringify(profile))
    // Simpan juga sebagai profil aktif umum
    localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(profile))
  } catch (err) {
    console.error('Failed to save campus profile to localStorage', err)
  }
}
