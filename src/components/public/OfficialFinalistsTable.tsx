import React, { useState, useMemo } from 'react'

// Official Results Dataset from index (4).html (Online Gontor Science Olympiad 2026)
// Format: [jenjang, peringkat, nama, kelas, kampus, waktu, nilai, finalis(1/0)]
export type CompetitionResultRow = [
  number, // jenjang (1-5)
  number, // peringkat dalam jenjang
  string, // nama santri
  string, // kelas
  string, // kampus
  string, // waktu pengerjaan
  number, // nilai
  number  // 1 = Finalis, 0 = Eliminated
]

export const OFFICIAL_RESULTS_2026: CompetitionResultRow[] = [
  [
    1,
    1,
    "Fathimah Mutiara Harida",
    "1-H",
    "Gontor Putri 1",
    "59 mnt 50 dtk",
    16,
    1
  ],
  [
    1,
    2,
    "Azel Karunia",
    "1",
    "Gontor Putri 2",
    "1 jam 30 mnt",
    16,
    1
  ],
  [
    1,
    3,
    "Nagita Aisha",
    "1",
    "Gontor Putri 2",
    "1 jam 30 mnt",
    14,
    1
  ],
  [
    1,
    4,
    "Hafidh Hamizan",
    "1",
    "Gontor 2",
    "1 jam 30 mnt",
    14,
    1
  ],
  [
    1,
    5,
    "Rania Arnetta",
    "1",
    "Gontor Putri 2",
    "1 jam 30 mnt",
    13,
    1
  ],
  [
    1,
    6,
    "Muhammad Umar",
    "1-C",
    "Gontor 4",
    "50 mnt 4 dtk",
    12,
    1
  ],
  [
    1,
    7,
    "Muhammad Fatih Nuruddin",
    "1-C",
    "Gontor 1",
    "1 jam 29 mnt",
    11,
    1
  ],
  [
    1,
    8,
    "Revalya Nurul Maulida",
    "1-C",
    "Gontor Putri 1",
    "54 mnt 34 dtk",
    10,
    1
  ],
  [
    1,
    9,
    "Azka Rahardino",
    "1",
    "Gontor 2",
    "1 jam 14 mnt",
    10,
    1
  ],
  [
    1,
    10,
    "Candra Wahyu",
    "1-B",
    "Gontor Putri 8",
    "1 jam",
    9,
    1
  ],
  [
    1,
    11,
    "Najwa Raihanah",
    "1-B",
    "Gontor Putri 8",
    "1 jam 1 mnt",
    9,
    1
  ],
  [
    1,
    12,
    "Brilliant Surya",
    "1",
    "Gontor 2",
    "1 jam 30 mnt",
    9,
    1
  ],
  [
    1,
    13,
    "Resa Asyukur",
    "1",
    "Gontor 2",
    "1 jam 30 mnt",
    8,
    1
  ],
  [
    1,
    14,
    "Ravif Budiono",
    "1-C",
    "Gontor 4",
    "1 jam 25 mnt",
    7,
    1
  ],
  [
    1,
    15,
    "Moh Robby",
    "1-C",
    "Gontor 4",
    "55 mnt 56 dtk",
    6,
    1
  ],
  [
    1,
    16,
    "Naufal Ma'arif",
    "1",
    "Gontor 7",
    "1 jam 21 mnt",
    6,
    1
  ],
  [
    1,
    17,
    "Adeeva Ghaitsa Kurnia",
    "1-H",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    6,
    1
  ],
  [
    1,
    18,
    "Fikri Nakhla",
    "1",
    "Gontor 7",
    "53 mnt 3 dtk",
    5,
    1
  ],
  [
    1,
    19,
    "Masya Fadiya",
    "1-B",
    "Gontor Putri 8",
    "1 jam 16 mnt",
    4,
    1
  ],
  [
    1,
    20,
    "Luthfi Arzana",
    "1-B",
    "Gontor Putri 8",
    "1 jam 12 mnt",
    3,
    1
  ],
  [
    1,
    21,
    "Rana Citra Wira",
    "1-B",
    "Gontor 3",
    "1 jam 22 mnt",
    3,
    0
  ],
  [
    1,
    22,
    "Fathan Athaghaly",
    "1-B",
    "Gontor 5",
    "1 jam 30 mnt",
    3,
    0
  ],
  [
    1,
    23,
    "Hafiz Bintang",
    "1-B",
    "Gontor 7",
    "57 mnt 37 dtk",
    1,
    0
  ],
  [
    1,
    24,
    "Iffah Rasyadah",
    "1",
    "Gontor Putri 2",
    "1 jam 30 mnt",
    1,
    0
  ],
  [
    1,
    25,
    "Lativa Putri Azzahra Baihaqi Zalva",
    "1-C",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    0,
    0
  ],
  [
    1,
    26,
    "Akhifa Sakhi",
    "1-C",
    "Gontor Putri 7",
    "1 jam 30 mnt",
    0,
    0
  ],
  [
    1,
    27,
    "Aqilla Rabbani Winata",
    "1-B",
    "Gontor Putri 7",
    "50 mnt 14 dtk",
    -2,
    0
  ],
  [
    1,
    28,
    "Alya Dhiya",
    "1-B",
    "Gontor Putri 6",
    "1 jam 30 mnt",
    -2,
    0
  ],
  [
    1,
    29,
    "Muhamad Hazka Adimirza",
    "1-B",
    "Gontor 10",
    "1 jam 28 mnt",
    -3,
    0
  ],
  [
    1,
    30,
    "Athallah Danish",
    "1-B",
    "Gontor 5",
    "1 jam 21 mnt",
    -4,
    0
  ],
  [
    1,
    31,
    "Rania Arfi",
    "1-B",
    "Gontor Putri 4",
    "1 jam 25 mnt",
    -5,
    0
  ],
  [
    1,
    32,
    "Aisyah Armaini",
    "1-B",
    "Gontor Putri 7",
    "1 jam 30 mnt",
    -5,
    0
  ],
  [
    1,
    33,
    "Syahira Nacita Boru Hutagaol",
    "1-C",
    "Gontor Putri 7",
    "29 mnt 4 dtk",
    -6,
    0
  ],
  [
    1,
    34,
    "Fakhri Setiahardi",
    "1-C",
    "Gontor 1",
    "1 jam 7 mnt",
    -6,
    0
  ],
  [
    1,
    35,
    "Kayyisah Almira",
    "1-B",
    "Gontor Putri 6",
    "1 jam 30 mnt",
    -6,
    0
  ],
  [
    1,
    36,
    "Adam Alfarezel",
    "1-B",
    "Gontor 7",
    "57 mnt 58 dtk",
    -7,
    0
  ],
  [
    1,
    37,
    "Muhammad Kevin",
    "1-B",
    "Gontor 4",
    "1 jam 4 mnt",
    -7,
    0
  ],
  [
    1,
    38,
    "Muhammad Aman",
    "1-C",
    "Gontor 1",
    "1 jam 8 mnt",
    -7,
    0
  ],
  [
    1,
    39,
    "Adinda Aisyah",
    "1-B",
    "Gontor Putri 6",
    "52 mnt 53 dtk",
    -9,
    0
  ],
  [
    1,
    40,
    "Abdullah Darusman Alfurqon",
    "1-B",
    "Gontor 3",
    "1 jam 16 mnt",
    -10,
    0
  ],
  [
    1,
    41,
    "Zacky Syabani",
    "1-C",
    "Gontor 5",
    "1 jam 30 mnt",
    -12,
    0
  ],
  [
    1,
    42,
    "Kautsar Mauza",
    "1-B",
    "Gontor 5",
    "1 jam 30 mnt",
    -12,
    0
  ],
  [
    1,
    43,
    "Rakan Faris Aqila Ruhiyat",
    "1-B",
    "Gontor 10",
    "57 mnt 20 dtk",
    -14,
    0
  ],
  [
    1,
    44,
    "Faqih Alfarizi",
    "1-B",
    "Gontor 12",
    "1 jam 23 mnt",
    -16,
    0
  ],
  [
    1,
    45,
    "Kairo Asyam Firdaus",
    "1-B",
    "Gontor 10",
    "1 jam 17 mnt",
    -18,
    0
  ],
  [
    1,
    46,
    "Ghathfan Naail Raizel",
    "1-C",
    "Gontor 3",
    "1 jam 22 mnt",
    -18,
    0
  ],
  [
    1,
    47,
    "Honey Ahmad",
    "1-E",
    "Gontor Putri 4",
    "1 jam 24 mnt",
    -20,
    0
  ],
  [
    1,
    48,
    "Afif Firdaus",
    "1-B",
    "Gontor 12",
    "1 jam 22 mnt",
    -22,
    0
  ],
  [
    1,
    49,
    "Shafiyah Amida",
    "1-B",
    "Gontor Putri 4",
    "1 jam 24 mnt",
    -24,
    0
  ],
  [
    1,
    50,
    "Ibnu Fakih Zakia Azaria Ryadi",
    "1-B",
    "Gontor 10",
    "43 mnt 28 dtk",
    -27,
    0
  ],
  [
    1,
    51,
    "Dara Fanigue",
    "1-B",
    "Gontor Putri 6",
    "56 mnt 16 dtk",
    -28,
    0
  ],
  [
    1,
    52,
    "Fatih Mahardika Mahardika",
    "1-C",
    "Gontor 3",
    "1 jam 22 mnt",
    -28,
    0
  ],
  [
    1,
    53,
    "Zidna Alfadilah",
    "1-B",
    "Gontor Putri 4",
    "1 jam 23 mnt",
    -28,
    0
  ],
  [
    1,
    54,
    "Luqman Al Misbachul Atsani",
    "1-C",
    "Gontor 1",
    "1 jam 5 mnt",
    -30,
    0
  ],
  [
    2,
    1,
    "Rayya Almahyra",
    "2-E",
    "Gontor Putri 1",
    "1 jam 29 mnt",
    22,
    1
  ],
  [
    2,
    2,
    "Achmad Haikal Kurniawan",
    "2-B",
    "Gontor 10",
    "1 jam 30 mnt",
    20,
    1
  ],
  [
    2,
    3,
    "Nada Nisrina Hasna Nadhifa",
    "2-E",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    18,
    1
  ],
  [
    2,
    4,
    "Muhammad Alfathih",
    "2-G",
    "Gontor 1",
    "1 jam 29 mnt",
    16,
    1
  ],
  [
    2,
    5,
    "Annisa Aini",
    "2-F",
    "Gontor Putri 4",
    "1 jam 30 mnt",
    14,
    1
  ],
  [
    2,
    6,
    "Ahmad Farhan",
    "2-B",
    "Gontor 4",
    "1 jam 17 mnt",
    12,
    1
  ],
  [
    2,
    7,
    "Raisya Azka",
    "2-H",
    "Gontor Putri 4",
    "1 jam 27 mnt",
    10,
    1
  ],
  [
    2,
    8,
    "Usman Habibur Rahman",
    "2-E",
    "Gontor 3",
    "1 jam 30 mnt",
    10,
    1
  ],
  [
    2,
    9,
    "Cedric Hugo",
    "2-C",
    "Gontor 4",
    "50 mnt 16 dtk",
    9,
    1
  ],
  [
    2,
    10,
    "Farah Sidqiya",
    "2-B",
    "Gontor Putri 8",
    "1 jam 7 mnt",
    9,
    1
  ],
  [
    2,
    11,
    "Shafira Linggasatya",
    "2-F",
    "Gontor Putri 4",
    "1 jam 25 mnt",
    8,
    1
  ],
  [
    2,
    12,
    "Nufail Jinan",
    "2-C",
    "Gontor 5",
    "1 jam 30 mnt",
    8,
    1
  ],
  [
    2,
    13,
    "Abdullah Faqih Rahman",
    "2-B",
    "Gontor 10",
    "1 jam 21 mnt",
    7,
    1
  ],
  [
    2,
    14,
    "Naia Salsabila",
    "2-B",
    "Gontor Putri 8",
    "55 mnt 59 dtk",
    4,
    1
  ],
  [
    2,
    15,
    "Dzakiyul Baahir Al Majid",
    "2-G",
    "Gontor 1",
    "1 jam 10 mnt",
    4,
    1
  ],
  [
    2,
    16,
    "Rafif Ahmad Maulana",
    "2-B",
    "Gontor 11",
    "1 jam 27 mnt",
    4,
    1
  ],
  [
    2,
    17,
    "Bening Cahaya Firdausi",
    "2-G",
    "Gontor Putri 1",
    "1 jam 27 mnt",
    4,
    1
  ],
  [
    2,
    18,
    "Khalwa Mafaza Qonita",
    "2-E",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    4,
    1
  ],
  [
    2,
    19,
    "Zidna Rohmah Laila",
    "2-I",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    4,
    1
  ],
  [
    2,
    20,
    "Muhammad Rafif",
    "2-E",
    "Gontor 4",
    "1 jam 17 mnt",
    3,
    1
  ],
  [
    2,
    21,
    "Muhammad Arqian Karim",
    "2-D",
    "Gontor 1",
    "1 jam 23 mnt",
    2,
    1
  ],
  [
    2,
    22,
    "Muhammad Arif Cahyanda",
    "2-B",
    "Gontor 10",
    "1 jam 26 mnt",
    2,
    1
  ],
  [
    2,
    23,
    "Airah Fitrah",
    "2-B",
    "Gontor Putri 7",
    "1 jam 30 mnt",
    2,
    1
  ],
  [
    2,
    24,
    "Haidar Almair Sanusi",
    "2-B",
    "Gontor 9",
    "41 mnt 7 dtk",
    1,
    0
  ],
  [
    2,
    25,
    "Fawwaz Zhafif Ahmad",
    "2-C",
    "Gontor 3",
    "1 jam 26 mnt",
    1,
    0
  ],
  [
    2,
    26,
    "Hisyam Maulana",
    "2-B",
    "Gontor 4",
    "1 jam 17 mnt",
    0,
    0
  ],
  [
    2,
    27,
    "Salsa Bila",
    "2-B",
    "Gontor Putri 6",
    "1 jam 28 mnt",
    0,
    0
  ],
  [
    2,
    28,
    "Muhammad Mahir Mubarak",
    "2-B",
    "Gontor 9",
    "24 mnt 44 dtk",
    -1,
    0
  ],
  [
    2,
    29,
    "Balqis Mutia",
    "2-B",
    "Gontor Putri 8",
    "1 jam 1 mnt",
    -1,
    0
  ],
  [
    2,
    30,
    "Laqif Alfarizi",
    "2-B",
    "Gontor 7",
    "40 mnt 1 dtk",
    -2,
    0
  ],
  [
    2,
    31,
    "Idzni Aurelia",
    "2-F",
    "Gontor Putri 4",
    "58 mnt 32 dtk",
    -2,
    0
  ],
  [
    2,
    32,
    "M. Gibran Fathir Alghafiqy",
    "2-B",
    "Gontor 10",
    "1 jam 30 mnt",
    -2,
    0
  ],
  [
    2,
    33,
    "Nasya Nailah",
    "2-B",
    "Gontor Putri 6",
    "1 jam 30 mnt",
    -2,
    0
  ],
  [
    2,
    34,
    "Justine Qhaisano",
    "2-B",
    "Gontor 7",
    "48 mnt 31 dtk",
    -3,
    0
  ],
  [
    2,
    35,
    "Raihanah Ghifariyah",
    "2-B",
    "Gontor Putri 8",
    "1 jam 8 mnt",
    -3,
    0
  ],
  [
    2,
    36,
    "Ahmad Rafi Qosim Asshiddiqi",
    "2-C",
    "Gontor 11",
    "1 jam 25 mnt",
    -3,
    0
  ],
  [
    2,
    37,
    "Nadia Dwi Pertiwi",
    "2-B",
    "Gontor Putri 3",
    "1 jam 25 mnt",
    -4,
    0
  ],
  [
    2,
    38,
    "Fuad Musyaffa",
    "2-D",
    "Gontor 3",
    "1 jam 29 mnt",
    -4,
    0
  ],
  [
    2,
    39,
    "Muhammad Syakir Nuroin",
    "2-E",
    "Gontor 3",
    "1 jam 22 mnt",
    -5,
    0
  ],
  [
    2,
    40,
    "Fayiz Arkan",
    "2",
    "Gontor 7",
    "1 jam 3 mnt",
    -7,
    0
  ],
  [
    2,
    41,
    "Rama Irfan Ghazali",
    "2-G",
    "Gontor 1",
    "1 jam 11 mnt",
    -9,
    0
  ],
  [
    2,
    42,
    "Afiqah Olivia",
    "2-B",
    "Gontor Putri 6",
    "1 jam 30 mnt",
    -9,
    0
  ],
  [
    2,
    43,
    "Indi Yani",
    "2-B",
    "Gontor Putri 7",
    "1 jam 30 mnt",
    -11,
    0
  ],
  [
    2,
    44,
    "Nahla Salsabila",
    "2-B",
    "Gontor Putri 7",
    "1 jam 30 mnt",
    -14,
    0
  ],
  [
    2,
    45,
    "Raisa Arafat",
    "2-B",
    "Gontor Putri 6",
    "1 jam 29 mnt",
    -17,
    0
  ],
  [
    2,
    46,
    "Muhammad Zahir In'am Amidev",
    "2-B",
    "Gontor 11",
    "1 jam 21 mnt",
    -19,
    0
  ],
  [
    2,
    47,
    "Muhammad Davin",
    "2-C",
    "Gontor 12",
    "1 jam 21 mnt",
    -22,
    0
  ],
  [
    2,
    48,
    "Attar Syahreza",
    "2-D",
    "Gontor 5",
    "1 jam 15 mnt",
    -28,
    0
  ],
  [
    2,
    49,
    "Tirta Bayu",
    "2-B",
    "Gontor 12",
    "1 jam 22 mnt",
    -29,
    0
  ],
  [
    2,
    50,
    "Satrio Pringgondani",
    "2-B",
    "Gontor 5",
    "1 jam 22 mnt",
    -32,
    0
  ],
  [
    2,
    51,
    "Kenzie Maulana",
    "2-C",
    "Gontor 12",
    "1 jam 25 mnt",
    -32,
    0
  ],
  [
    2,
    52,
    "Muhammad Faqih",
    "2-B",
    "Gontor 12",
    "1 jam 29 mnt",
    -32,
    0
  ],
  [
    2,
    53,
    "Hudzaifah Nizam",
    "2-B",
    "Gontor 5",
    "1 jam 18 mnt",
    -34,
    0
  ],
  [
    3,
    1,
    "Neutral Sakka Fudianto",
    "3-B",
    "Gontor 1",
    "1 jam 29 mnt",
    22,
    1
  ],
  [
    3,
    2,
    "Ridwan Abqary Noor Ahmad",
    "3-B",
    "Gontor 1",
    "1 jam 29 mnt",
    20,
    1
  ],
  [
    3,
    3,
    "Safaraz Akma",
    "1 int",
    "Gontor 2",
    "1 jam 30 mnt",
    15,
    1
  ],
  [
    3,
    4,
    "Aulya Widjayati Nugroho",
    "3-B",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    15,
    1
  ],
  [
    3,
    5,
    "Hasni Aulia",
    "1 int B",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    14,
    1
  ],
  [
    3,
    6,
    "Izzatunnisa El-Mahira",
    "3-B",
    "Gontor Putri 1",
    "1 jam 26 mnt",
    12,
    1
  ],
  [
    3,
    7,
    "Theona Afifah Elysia",
    "3-B",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    12,
    1
  ],
  [
    3,
    8,
    "Bella Niisa",
    "3-B",
    "Gontor Putri 4",
    "1 jam 30 mnt",
    10,
    1
  ],
  [
    3,
    9,
    "Haura Qulbi",
    "3-B",
    "Gontor Putri 4",
    "1 jam 24 mnt",
    8,
    1
  ],
  [
    3,
    10,
    "Syaca Faiz",
    "1 int",
    "Gontor 2",
    "1 jam 30 mnt",
    8,
    1
  ],
  [
    3,
    11,
    "Sofiya Anjuna",
    "1 int",
    "Gontor Putri 2",
    "1 jam 28 mnt",
    6,
    1
  ],
  [
    3,
    12,
    "Zaskia Riena",
    "1 int",
    "Gontor Putri 2",
    "1 jam 29 mnt",
    6,
    1
  ],
  [
    3,
    13,
    "Novan Azzam",
    "1 int",
    "Gontor 2",
    "1 jam 30 mnt",
    5,
    1
  ],
  [
    3,
    14,
    "Omar Jahran Sarwoaji",
    "3-K",
    "Gontor 1",
    "1 jam 30 mnt",
    5,
    1
  ],
  [
    3,
    15,
    "Hafiz Arsyad",
    "3-B",
    "Gontor 4",
    "49 mnt 1 dtk",
    4,
    1
  ],
  [
    3,
    16,
    "Rizky Aulia",
    "3-B",
    "Gontor Putri 7",
    "1 jam 24 mnt",
    4,
    1
  ],
  [
    3,
    17,
    "Arsya Zivanka",
    "3-B",
    "Gontor Putri 6",
    "1 jam",
    3,
    1
  ],
  [
    3,
    18,
    "Alya Carissa",
    "3-B",
    "Gontor Putri 8",
    "1 jam 23 mnt",
    3,
    1
  ],
  [
    3,
    19,
    "Elfachry Nuswantoro",
    "3-B",
    "Gontor 4",
    "59 mnt",
    2,
    1
  ],
  [
    3,
    20,
    "Vania Mustari",
    "3-B",
    "Gontor Putri 4",
    "1 jam 30 mnt",
    2,
    1
  ],
  [
    3,
    21,
    "Kadiza Queena Reaji Putri",
    "3-B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    2,
    1
  ],
  [
    3,
    22,
    "Barry Vilagurbah",
    "3-B",
    "Gontor 5",
    "1 jam 18 mnt",
    1,
    0
  ],
  [
    3,
    23,
    "Wikita Sari",
    "1 int B",
    "Gontor Putri 7",
    "1 jam 21 mnt",
    1,
    0
  ],
  [
    3,
    24,
    "Rafif Wahyu",
    "3-B",
    "Gontor 7",
    "39 mnt 12 dtk",
    0,
    0
  ],
  [
    3,
    25,
    "Syam Adib",
    "3-D",
    "Gontor 4",
    "51 mnt 26 dtk",
    0,
    0
  ],
  [
    3,
    26,
    "Gabriel Farros",
    "3-C",
    "Gontor 5",
    "1 jam 26 mnt",
    0,
    0
  ],
  [
    3,
    27,
    "Nabil Fathul",
    "1 int",
    "Gontor 2",
    "1 jam 29 mnt",
    0,
    0
  ],
  [
    3,
    28,
    "Avidenaya Kamilatunnisa",
    "3-B",
    "Gontor Putri 8",
    "1 jam 30 mnt",
    0,
    0
  ],
  [
    3,
    29,
    "Azka Faishal",
    "1 int",
    "Gontor 7",
    "38 mnt 28 dtk",
    -1,
    0
  ],
  [
    3,
    30,
    "Nayla Istaz",
    "3-B",
    "Gontor Putri 6",
    "57 mnt 46 dtk",
    -1,
    0
  ],
  [
    3,
    31,
    "Hanum Parinduri",
    "3-B",
    "Gontor Putri 6",
    "59 mnt 2 dtk",
    -1,
    0
  ],
  [
    3,
    32,
    "Bilqis Chyta",
    "1 int",
    "Gontor Putri 2",
    "1 jam 30 mnt",
    -1,
    0
  ],
  [
    3,
    33,
    "Dzahab Ghaly",
    "3-D",
    "Gontor 4",
    "30 mnt 38 dtk",
    -2,
    0
  ],
  [
    3,
    34,
    "Rafa Khoirul",
    "3-B",
    "Gontor 7",
    "48 mnt 30 dtk",
    -2,
    0
  ],
  [
    3,
    35,
    "Kayyisa Naura",
    "1 int",
    "Gontor Putri 2",
    "1 jam 29 mnt",
    -2,
    0
  ],
  [
    3,
    36,
    "Dira Darmawan",
    "3-B",
    "Gontor 10",
    "1 jam 30 mnt",
    -2,
    0
  ],
  [
    3,
    37,
    "Sumario Setiyoaji Baskoro Idris Pasa Sapto Junior",
    "3-B",
    "Gontor 3",
    "49 mnt 4 dtk",
    -3,
    0
  ],
  [
    3,
    38,
    "Ainan Aufa Al Amin",
    "3-B",
    "Gontor 3",
    "51 mnt 25 dtk",
    -3,
    0
  ],
  [
    3,
    39,
    "Umar Maulana",
    "3-C",
    "Gontor 5",
    "1 jam 30 mnt",
    -3,
    0
  ],
  [
    3,
    40,
    "Cahyandaru Sekar Cettha Purnomo",
    "3-C",
    "Gontor Putri 3",
    "1 jam 14 mnt",
    -4,
    0
  ],
  [
    3,
    41,
    "Sakhi Alvaro Mumtaz Surseno",
    "3-B",
    "Gontor 10",
    "1 jam 17 mnt",
    -4,
    0
  ],
  [
    3,
    42,
    "Mahbub Bil Haq",
    "3-B",
    "Gontor 1",
    "1 jam 27 mnt",
    -4,
    0
  ],
  [
    3,
    43,
    "Amalia Putri Setyo Ningrum",
    "1 int B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -4,
    0
  ],
  [
    3,
    44,
    "Azzizah Artimefia Afrila",
    "3-B",
    "Gontor Putri 7",
    "1 jam 21 mnt",
    -5,
    0
  ],
  [
    3,
    45,
    "Azkia Azza",
    "3-B",
    "Gontor Putri 8",
    "1 jam 23 mnt",
    -5,
    0
  ],
  [
    3,
    46,
    "Riko Hadi",
    "3-C",
    "Gontor 7",
    "20 mnt 3 dtk",
    -6,
    0
  ],
  [
    3,
    47,
    "Nayla Al-azra",
    "3-B",
    "Gontor Putri 6",
    "1 jam 5 mnt",
    -6,
    0
  ],
  [
    3,
    48,
    "Indana Halwah Raqiqah",
    "3-B",
    "Gontor Putri 7",
    "1 jam 16 mnt",
    -6,
    0
  ],
  [
    3,
    49,
    "Nadzifa Zhahira",
    "3-B",
    "Gontor Putri 8",
    "1 jam 25 mnt",
    -6,
    0
  ],
  [
    3,
    50,
    "Narendra Fadhil",
    "3-B",
    "Gontor 5",
    "1 jam 27 mnt",
    -6,
    0
  ],
  [
    3,
    51,
    "Nasywa Naa'fiah Nur Aldzakiyah",
    "3-C",
    "Gontor Putri 3",
    "1 jam 28 mnt",
    -6,
    0
  ],
  [
    3,
    52,
    "Muhammad Yahya",
    "3-B",
    "Gontor 7",
    "36 mnt 35 dtk",
    -7,
    0
  ],
  [
    3,
    53,
    "Faith Ibrahim Abidin",
    "3-B",
    "Gontor 3",
    "1 jam 17 mnt",
    -7,
    0
  ],
  [
    3,
    54,
    "Muhammad Arif Sarifudin",
    "3-B",
    "Gontor 11",
    "1 jam 22 mnt",
    -10,
    0
  ],
  [
    3,
    55,
    "Muhammad Hasyim",
    "3-B",
    "Gontor 12",
    "1 jam 30 mnt",
    -10,
    0
  ],
  [
    3,
    56,
    "Zafina Althafunnisa",
    "3-D",
    "Gontor Putri 4",
    "1 jam 29 mnt",
    -11,
    0
  ],
  [
    3,
    57,
    "Zeffy Athabarani Priyono",
    "3-B",
    "Gontor 10",
    "1 jam 18 mnt",
    -12,
    0
  ],
  [
    3,
    58,
    "Nafia Ilmah Sidkiyah",
    "1 int B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -12,
    0
  ],
  [
    3,
    59,
    "Kalila Alizza Romadhona",
    "3-F",
    "Gontor Putri 3",
    "1 jam 29 mnt",
    -13,
    0
  ],
  [
    3,
    60,
    "Leni Helga Pandu Winata",
    "3-J",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -13,
    0
  ],
  [
    3,
    61,
    "Batrisyia Sabrina Mustaqim",
    "3-C",
    "Gontor Putri 3",
    "1 jam 2 mnt",
    -14,
    0
  ],
  [
    3,
    62,
    "Muhammad Fatih Anwar",
    "3-B",
    "Gontor 11",
    "1 jam 28 mnt",
    -18,
    0
  ],
  [
    3,
    63,
    "Allif Febrian",
    "3-B",
    "Gontor 12",
    "1 jam 30 mnt",
    -18,
    0
  ],
  [
    3,
    64,
    "Kaizan Fahmi Arsafin",
    "3-B",
    "Gontor 10",
    "1 jam 18 mnt",
    -24,
    0
  ],
  [
    3,
    65,
    "Aktharsya Arya Dharma",
    "3-E",
    "Gontor 3",
    "1 jam 30 mnt",
    -28,
    0
  ],
  [
    4,
    1,
    "Athiyyah Meiogyne",
    "4-B",
    "Gontor Putri 8",
    "1 jam 10 mnt",
    12,
    1
  ],
  [
    4,
    2,
    "Raifal Sugiono",
    "3 int B",
    "Gontor 1",
    "1 jam 29 mnt",
    10,
    1
  ],
  [
    4,
    3,
    "Zahira Aqilah",
    "4-B",
    "Gontor Putri 8",
    "1 jam 10 mnt",
    8,
    1
  ],
  [
    4,
    4,
    "Rahmania Nazla",
    "4-B",
    "Gontor Putri 6",
    "1 jam 8 mnt",
    5,
    1
  ],
  [
    4,
    5,
    "Marwah Naila",
    "4-B",
    "Gontor Putri 8",
    "1 jam 11 mnt",
    4,
    1
  ],
  [
    4,
    6,
    "Shafa Azzahra Chusnul Khotim",
    "4-B",
    "Gontor Putri 1",
    "1 jam 21 mnt",
    4,
    1
  ],
  [
    4,
    7,
    "Salsabila Auliyannisa Giyatmoko",
    "3 int C",
    "Gontor Putri 3",
    "1 jam 22 mnt",
    4,
    1
  ],
  [
    4,
    8,
    "Alfi Syabil",
    "4-D",
    "Gontor 4",
    "1 jam",
    3,
    1
  ],
  [
    4,
    9,
    "Delima Izanagi Khalesa",
    "3 int B",
    "Gontor Putri 1",
    "1 jam 28 mnt",
    2,
    1
  ],
  [
    4,
    10,
    "Fikri Al-fadhil",
    "4-B",
    "Gontor 5",
    "1 jam 8 mnt",
    1,
    1
  ],
  [
    4,
    11,
    "Umar Hasan",
    "4-D",
    "Gontor 4",
    "45 mnt 28 dtk",
    0,
    1
  ],
  [
    4,
    12,
    "Naufal Mufid",
    "3 int B",
    "Gontor 1",
    "1 jam 9 mnt",
    0,
    1
  ],
  [
    4,
    13,
    "Muhammad Khawarizmi Avicena",
    "3 int F",
    "Gontor 1",
    "1 jam 30 mnt",
    0,
    1
  ],
  [
    4,
    14,
    "Lalitya Suherman",
    "4-B",
    "Gontor Putri 6",
    "26 mnt 44 dtk",
    -1,
    1
  ],
  [
    4,
    15,
    "Noer Huda",
    "4-B",
    "Gontor 5",
    "43 mnt 4 dtk",
    -1,
    1
  ],
  [
    4,
    16,
    "Kanugrahan Prasetya Jati",
    "4-B",
    "Gontor 3",
    "1 jam 11 mnt",
    -2,
    1
  ],
  [
    4,
    17,
    "Sania Mareta Putri",
    "3 int B",
    "Gontor Putri 7",
    "1 jam 20 mnt",
    -2,
    1
  ],
  [
    4,
    18,
    "Aiesha Valerie Cahyana Putri",
    "3 int C",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -2,
    1
  ],
  [
    4,
    19,
    "Fahri Zafran",
    "3 int B",
    "Gontor 7",
    "21 mnt 37 dtk",
    -3,
    1
  ],
  [
    4,
    20,
    "Reynard Ality",
    "4-C",
    "Gontor 7",
    "31 mnt 8 dtk",
    -3,
    1
  ],
  [
    4,
    21,
    "Hilwa Neelnamuna",
    "4-B",
    "Gontor Putri 6",
    "35 mnt 3 dtk",
    -3,
    0
  ],
  [
    4,
    22,
    "Abdurrahman Akmal Hibatullah",
    "4-B",
    "Gontor 10",
    "50 mnt 16 dtk",
    -3,
    0
  ],
  [
    4,
    23,
    "Hasna Syakira",
    "3 int B",
    "Gontor Putri 4",
    "1 jam 28 mnt",
    -3,
    0
  ],
  [
    4,
    24,
    "Kiran Karim",
    "3 int B",
    "Gontor Putri 4",
    "1 jam 29 mnt",
    -3,
    0
  ],
  [
    4,
    25,
    "Humaida Salwa Kaulika",
    "3 int B",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    -4,
    0
  ],
  [
    4,
    26,
    "Muhammad Ayyubi Ubaidillah Azzam",
    "4-C",
    "Gontor 3",
    "1 jam 1 mnt",
    -5,
    0
  ],
  [
    4,
    27,
    "Affandi Gozali",
    "4-D",
    "Gontor 5",
    "1 jam 30 mnt",
    -5,
    0
  ],
  [
    4,
    28,
    "Nabila Fitria",
    "3 int B",
    "Gontor Putri 4",
    "1 jam 30 mnt",
    -5,
    0
  ],
  [
    4,
    29,
    "Khadijah Hasanah",
    "4-B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -5,
    0
  ],
  [
    4,
    30,
    "Alfien Reihan",
    "3 int B",
    "Gontor 7",
    "36 mnt 16 dtk",
    -6,
    0
  ],
  [
    4,
    31,
    "Nisak Velose",
    "4-B",
    "Gontor Putri 8",
    "1 jam 11 mnt",
    -6,
    0
  ],
  [
    4,
    32,
    "Syifa Selomitha",
    "4-B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -6,
    0
  ],
  [
    4,
    33,
    "Muhammad Azzam",
    "4-B",
    "Gontor 4",
    "46 mnt 53 dtk",
    -7,
    0
  ],
  [
    4,
    34,
    "Kenzie Farzana Estungkara",
    "4-B",
    "Gontor 3",
    "58 mnt 25 dtk",
    -7,
    0
  ],
  [
    4,
    35,
    "Muhammad Adil Al-Ma'ruf",
    "4-B",
    "Gontor 11",
    "1 jam 23 mnt",
    -7,
    0
  ],
  [
    4,
    36,
    "Almer Rizky Albion",
    "4-B",
    "Gontor 11",
    "1 jam 25 mnt",
    -7,
    0
  ],
  [
    4,
    37,
    "Ario Fajar",
    "4-B",
    "Gontor 12",
    "1 jam 30 mnt",
    -7,
    0
  ],
  [
    4,
    38,
    "Dinda Aprilia",
    "4-B",
    "Gontor Putri 6",
    "26 mnt 41 dtk",
    -8,
    0
  ],
  [
    4,
    39,
    "Amienullah Zambrud",
    "3 int D",
    "Gontor 5",
    "1 jam 29 mnt",
    -8,
    0
  ],
  [
    4,
    40,
    "Akbar Zahid Hamdi",
    "4-B",
    "Gontor 3",
    "1 jam 6 mnt",
    -9,
    0
  ],
  [
    4,
    41,
    "Al-Rozali Jazuli",
    "4-C",
    "Gontor 7",
    "25 mnt 17 dtk",
    -10,
    0
  ],
  [
    4,
    42,
    "Muhammad Romy Lazuardi",
    "4-B",
    "Gontor 10",
    "1 jam 10 mnt",
    -10,
    0
  ],
  [
    4,
    43,
    "Nur Alfiansyah",
    "4-D",
    "Gontor 4",
    "1 jam 9 mnt",
    -11,
    0
  ],
  [
    4,
    44,
    "Feby Saparwani",
    "4-B",
    "Gontor Putri 1",
    "1 jam 29 mnt",
    -11,
    0
  ],
  [
    4,
    45,
    "Walida Zakia",
    "4-G",
    "Gontor Putri 4",
    "1 jam 30 mnt",
    -12,
    0
  ],
  [
    4,
    46,
    "Syabil Alfarisi",
    "4-B",
    "Gontor 12",
    "1 jam 30 mnt",
    -12,
    0
  ],
  [
    4,
    47,
    "Jelita Mafaza",
    "4-B",
    "Gontor Putri 3",
    "1 jam 28 mnt",
    -13,
    0
  ],
  [
    4,
    48,
    "Muhammad Khairul Umam",
    "3 int D",
    "Gontor 1",
    "1 jam 30 mnt",
    -14,
    0
  ],
  [
    4,
    49,
    "Rr.Aliya Shofia Dimitri",
    "3 int B",
    "Gontor Putri 7",
    "1 jam 20 mnt",
    -15,
    0
  ],
  [
    4,
    50,
    "Afifa Meisya Sodiq",
    "4-B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -15,
    0
  ],
  [
    4,
    51,
    "Sidiq Agung Prayoga",
    "4-B",
    "Gontor 11",
    "1 jam 28 mnt",
    -16,
    0
  ],
  [
    4,
    52,
    "Maghfiroh Wulan Ramadhani",
    "4-B",
    "Gontor Putri 7",
    "1 jam 19 mnt",
    -20,
    0
  ],
  [
    4,
    53,
    "Mas Alfaridzi Gavriy Chaqti",
    "4-B",
    "Gontor 10",
    "41 mnt 28 dtk",
    -23,
    0
  ],
  [
    4,
    54,
    "Fadilah Indini Siregar",
    "4-B",
    "Gontor Putri 7",
    "1 jam 17 mnt",
    -26,
    0
  ],
  [
    4,
    55,
    "Ibrahim Rafa Wicaksono",
    "4-B",
    "Gontor 10",
    "1 jam 15 mnt",
    -27,
    0
  ],
  [
    5,
    1,
    "Luqmanul Hakim Rahmatulloh",
    "5-B",
    "Gontor 3",
    "1 jam 19 mnt",
    9,
    1
  ],
  [
    5,
    2,
    "Saniya Ayu Safira",
    "5-B",
    "Gontor Putri 1",
    "1 jam 1 mnt",
    6,
    1
  ],
  [
    5,
    3,
    "Ossie Aliandra",
    "5-B",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    5,
    1
  ],
  [
    5,
    4,
    "Fanisha Hasbi Ataya",
    "5-B",
    "Gontor Putri 7",
    "42 mnt 41 dtk",
    3,
    1
  ],
  [
    5,
    5,
    "Lakeisha Nadhifa Khansa",
    "5-B",
    "Gontor Putri 7",
    "52 mnt 31 dtk",
    3,
    1
  ],
  [
    5,
    6,
    "Mumtaz Taruna",
    "5-B",
    "Gontor Putri 6",
    "20 mnt 15 dtk",
    2,
    1
  ],
  [
    5,
    7,
    "Faridus Shidqi",
    "5-B",
    "Gontor 4",
    "58 mnt 50 dtk",
    2,
    1
  ],
  [
    5,
    8,
    "Aufa Nuha",
    "5-D",
    "Gontor 4",
    "1 jam 15 mnt",
    1,
    1
  ],
  [
    5,
    9,
    "Arroyan Alam",
    "5-C",
    "Gontor 4",
    "58 mnt 27 dtk",
    0,
    1
  ],
  [
    5,
    10,
    "Chalisa Safira Putri",
    "5-B",
    "Gontor Putri 1",
    "1 jam 28 mnt",
    0,
    1
  ],
  [
    5,
    11,
    "Salsabila Nadhifa Aqila",
    "5-B",
    "Gontor Putri 1",
    "1 jam 30 mnt",
    -1,
    1
  ],
  [
    5,
    12,
    "Muhammad Safa Azzam Al-wathon",
    "5-Q",
    "Gontor 1",
    "1 jam 7 mnt",
    -2,
    1
  ],
  [
    5,
    13,
    "Syifa Ramadhani",
    "5-B",
    "Gontor Putri 7",
    "55 mnt 56 dtk",
    -3,
    1
  ],
  [
    5,
    14,
    "Dwizia Elzafira",
    "5-B",
    "Gontor Putri 8",
    "58 mnt 45 dtk",
    -3,
    1
  ],
  [
    5,
    15,
    "Zaid Bahrul",
    "5-B",
    "Gontor 7",
    "1 jam 1 mnt",
    -3,
    1
  ],
  [
    5,
    16,
    "Nakhwah Nisaul Jinan",
    "5-B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -3,
    1
  ],
  [
    5,
    17,
    "Jauza Dzakiyah",
    "5-C",
    "Gontor Putri 8",
    "1 jam 19 mnt",
    -4,
    1
  ],
  [
    5,
    18,
    "Khalila Maziyaturrohmah",
    "5-C",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -4,
    1
  ],
  [
    5,
    19,
    "Farhan Elrasyid",
    "5-B",
    "Gontor 7",
    "1 jam 12 mnt",
    -5,
    1
  ],
  [
    5,
    20,
    "Muhammad Adly Ridwan",
    "5-B",
    "Gontor 3",
    "1 jam 23 mnt",
    -5,
    1
  ],
  [
    5,
    21,
    "Syaira Hermawan",
    "5-B",
    "Gontor Putri 6",
    "24 mnt 3 dtk",
    -6,
    0
  ],
  [
    5,
    22,
    "Zahiya Roina",
    "5-B",
    "Gontor Putri 8",
    "1 jam 9 mnt",
    -6,
    0
  ],
  [
    5,
    23,
    "Muhammad Izzuddin Fardhana Nugraha",
    "5-B",
    "Gontor 3",
    "1 jam 20 mnt",
    -6,
    0
  ],
  [
    5,
    24,
    "Sairuf Musdhofa",
    "5",
    "Gontor 2",
    "1 jam 30 mnt",
    -6,
    0
  ],
  [
    5,
    25,
    "Olivia Mulyanesa",
    "5-B",
    "Gontor Putri 6",
    "22 mnt 31 dtk",
    -7,
    0
  ],
  [
    5,
    26,
    "Yusuf Fadlan",
    "5-D",
    "Gontor 7",
    "1 jam 2 mnt",
    -7,
    0
  ],
  [
    5,
    27,
    "Diva Mulia",
    "5-B",
    "Gontor Putri 8",
    "1 jam 17 mnt",
    -7,
    0
  ],
  [
    5,
    28,
    "Ghaitsa Atha",
    "5-B",
    "Gontor Putri 2",
    "1 jam 22 mnt",
    -7,
    0
  ],
  [
    5,
    29,
    "Talita Hasna Humairah",
    "5-B",
    "Gontor Putri 3",
    "1 jam 30 mnt",
    -7,
    0
  ],
  [
    5,
    30,
    "Rizky Al. Fawwaz",
    "5-D",
    "Gontor 7",
    "56 mnt 49 dtk",
    -8,
    0
  ],
  [
    5,
    31,
    "Mirza Khuzairon Arafat",
    "5-N",
    "Gontor 1",
    "1 jam 2 mnt",
    -8,
    0
  ],
  [
    5,
    32,
    "Aldebaran Al Kautsar",
    "5-B",
    "Gontor 12",
    "1 jam 26 mnt",
    -9,
    0
  ],
  [
    5,
    33,
    "Dezah Hamzah",
    "5-B",
    "Gontor 12",
    "1 jam 24 mnt",
    -10,
    0
  ],
  [
    5,
    34,
    "Syafa Azzahra",
    "5-G",
    "Gontor Putri 4",
    "1 jam 30 mnt",
    -11,
    0
  ],
  [
    5,
    35,
    "Luthfi Baihaqi",
    "5-N",
    "Gontor 1",
    "51 mnt 35 dtk",
    -14,
    0
  ],
  [
    5,
    36,
    "Dzaky Setiawan",
    "5-D",
    "Gontor 4",
    "1 jam 30 mnt",
    -14,
    0
  ],
  [
    5,
    37,
    "Ahmad Isro'i",
    "5-C",
    "Gontor 12",
    "1 jam 30 mnt",
    -14,
    0
  ],
  [
    5,
    38,
    "Syila Khairunnisa",
    "5-B",
    "Gontor Putri 7",
    "29 mnt 49 dtk",
    -15,
    0
  ],
  [
    5,
    39,
    "Haidar Ali Rahman",
    "5-B",
    "Gontor 3",
    "1 jam 21 mnt",
    -16,
    0
  ],
  [
    5,
    40,
    "Putri Ghofiroh",
    "5-F",
    "Gontor Putri 4",
    "1 jam 23 mnt",
    -17,
    0
  ],
  [
    5,
    41,
    "Callysta Putri",
    "5-C",
    "Gontor Putri 4",
    "1 jam 28 mnt",
    -17,
    0
  ],
  [
    5,
    42,
    "Sabrina Hailalah",
    "5-B",
    "Gontor Putri 6",
    "30 mnt 26 dtk",
    -19,
    0
  ],
  [
    5,
    43,
    "Najwa Kurnadi",
    "5-B",
    "Gontor Putri 2",
    "1 jam 18 mnt",
    -19,
    0
  ],
  [
    5,
    44,
    "Muh. Aidil A. Lamakkulawuzar",
    "5-B",
    "Gontor 11",
    "1 jam 28 mnt",
    -20,
    0
  ],
  [
    5,
    45,
    "Arya Pratama",
    "5-C",
    "Gontor 12",
    "1 jam 30 mnt",
    -20,
    0
  ],
  [
    5,
    46,
    "Keisha Evelyn",
    "5-B",
    "Gontor Putri 3",
    "1 jam 23 mnt",
    -23,
    0
  ],
  [
    5,
    47,
    "Ezra Faiyaz",
    "5-B",
    "Gontor 5",
    "1 jam 13 mnt",
    -24,
    0
  ],
  [
    5,
    48,
    "Hidayat Noor Akmal",
    "5-N",
    "Gontor 1",
    "1 jam 20 mnt",
    -24,
    0
  ],
  [
    5,
    49,
    "Futhaira Al-khansa",
    "5-B",
    "Gontor Putri 2",
    "1 jam 25 mnt",
    -24,
    0
  ],
  [
    5,
    50,
    "Raditya Faatih Maheswara",
    "5-B",
    "Gontor 10",
    "42 mnt 53 dtk",
    -32,
    0
  ],
  [
    5,
    51,
    "Azaria Azzam Malih",
    "5-B",
    "Gontor 10",
    "1 jam 14 mnt",
    -32,
    0
  ],
  [
    5,
    52,
    "Bilqis Azzahra",
    "5-B",
    "Gontor Putri 4",
    "1 jam 21 mnt",
    -32,
    0
  ],
  [
    5,
    53,
    "Naurah Bilqis",
    "5-B",
    "Gontor Putri 2",
    "1 jam 19 mnt",
    -34,
    0
  ],
  [
    5,
    54,
    "Muhammad Faiz Abid",
    "5-B",
    "Gontor 11",
    "1 jam 21 mnt",
    -36,
    0
  ],
  [
    5,
    55,
    "Thomas Robby Arisandy",
    "5-B",
    "Gontor 10",
    "58 mnt 39 dtk",
    -38,
    0
  ],
  [
    5,
    56,
    "Abdul Rosyid",
    "5-B",
    "Gontor 11",
    "1 jam 29 mnt",
    -38,
    0
  ]
]

// Backward-compatibility alias for finalists only
export const OFFICIAL_FINALISTS_2026 = OFFICIAL_RESULTS_2026.filter((r) => r[7] === 1)

export interface OfficialFinalistsTableProps {
  showHeader?: boolean
}

export const OfficialFinalistsTable: React.FC<OfficialFinalistsTableProps> = ({ showHeader = true }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('') // '' = Semua, '1' = Finalis, '0' = Eliminated
  const [selectedJenjang, setSelectedJenjang] = useState<number>(0) // 0 = Semua

  // Distinct campuses sorted alphabetically
  const campuses = useMemo(() => {
    const set = new Set<string>()
    OFFICIAL_RESULTS_2026.forEach((r) => set.add(r[4]))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))
  }, [])

  // Filtered dataset matching index (4).html logic
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return OFFICIAL_RESULTS_2026.filter((r) => {
      const matchJenjang = !selectedJenjang || r[0] === selectedJenjang
      const matchCampus = !selectedCampus || r[4] === selectedCampus
      const matchStatus = selectedStatus === '' || r[7] === Number(selectedStatus)
      const matchQuery = !q || (r[2] + ' ' + r[4]).toLowerCase().includes(q)
      return matchJenjang && matchCampus && matchStatus && matchQuery
    })
  }, [searchQuery, selectedCampus, selectedStatus, selectedJenjang])

  const totalFinalists = useMemo(
    () => OFFICIAL_RESULTS_2026.filter((r) => r[7] === 1).length,
    []
  )
  const totalEliminated = useMemo(
    () => OFFICIAL_RESULTS_2026.filter((r) => r[7] === 0).length,
    []
  )

  return (
    <section id="pengumuman-hasil" className="w-full bg-[#f6f8f5] dark:bg-[#0d1511] text-[#14231c] dark:text-[#e8f0eb] transition-colors pb-16">
      {/* Hero Header matching index (4).html */}
      {showHeader && (
        <div className="bg-gradient-to-br from-[#0a4f37] via-[#0f6b4a] to-[#1a8a60] text-white pt-14 pb-20 px-5 text-center">
          <span className="inline-block tracking-widest font-bold text-xs bg-white/15 px-3.5 py-1.5 rounded-full mb-4 uppercase">
            BABAK FINAL · 2026
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3">
            Selamat kepada <span className="text-[#f3d27a]">Para Finalis</span> OGSO 2026
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base opacity-90 leading-relaxed font-normal">
            Online Gontor Science Olympiad — hasil babak penyisihan seluruh peserta. Yang lolos ditandai <b>Finalis</b>, selebihnya <b>Eliminated</b>.
          </p>
        </div>
      )}

      <div className={`max-w-[1000px] mx-auto px-4 ${!showHeader ? 'pt-8' : ''}`}>
        {/* Metric Summary Cards (-40px negative margin matching index (4).html) */}
        <div className="grid grid-cols-3 gap-3 -mt-10 mb-6">
          <div className="bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl p-3.5 text-center shadow-lg">
            <b className="block text-2xl sm:text-3xl font-extrabold text-[#0f6b4a] dark:text-[#4fc08f]">
              {OFFICIAL_RESULTS_2026.length}
            </b>
            <span className="text-xs sm:text-sm text-[#5b6b62] dark:text-[#93a69b]">Peserta</span>
          </div>
          <div className="bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl p-3.5 text-center shadow-lg">
            <b className="block text-2xl sm:text-3xl font-extrabold text-[#0f6b4a] dark:text-[#4fc08f]">
              {totalFinalists}
            </b>
            <span className="text-xs sm:text-sm text-[#5b6b62] dark:text-[#93a69b]">Finalis</span>
          </div>
          <div className="bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl p-3.5 text-center shadow-lg">
            <b className="block text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {totalEliminated}
            </b>
            <span className="text-xs sm:text-sm text-[#5b6b62] dark:text-[#93a69b]">Eliminated</span>
          </div>
        </div>

        {/* Search, Status, Campus, and Filter Tools */}
        <div className="my-6 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kampus…"
                className="w-full bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] text-[#14231c] dark:text-[#e8f0eb] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6b4a] dark:focus:ring-[#4fc08f] transition-all"
              />
            </div>
            <div>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] text-[#14231c] dark:text-[#e8f0eb] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6b4a] dark:focus:ring-[#4fc08f] transition-all"
              >
                <option value="">Semua kampus</option>
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] text-[#14231c] dark:text-[#e8f0eb] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6b4a] dark:focus:ring-[#4fc08f] transition-all"
              >
                <option value="">Semua status</option>
                <option value="1">Finalis</option>
                <option value="0">Eliminated</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2 items-center">
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedJenjang(lvl)}
                  type="button"
                  className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    selectedJenjang === lvl
                      ? 'bg-[#0f6b4a] dark:bg-[#4fc08f] text-white dark:text-[#0d1511] border-[#0f6b4a] dark:border-[#4fc08f] shadow-sm'
                      : 'bg-white dark:bg-[#14201a] text-[#14231c] dark:text-[#e8f0eb] border-[#dfe7e1] dark:border-[#233229] hover:border-[#0f6b4a]'
                  }`}
                >
                  {lvl === 0 ? 'Semua' : `Jenjang ${lvl}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter matching index (4).html */}
        <div className="text-sm text-[#5b6b62] dark:text-[#93a69b] my-2">
          Menampilkan {filteredData.length} dari {OFFICIAL_RESULTS_2026.length} peserta
        </div>

        {/* Table View matching index (4).html */}
        <div className="overflow-x-auto bg-white dark:bg-[#14201a] border border-[#dfe7e1] dark:border-[#233229] rounded-2xl shadow-sm mb-12">
          <table className="w-full border-collapse text-sm min-w-[760px]">
            <thead>
              <tr className="bg-[#eef4f0] dark:bg-[#192a21] text-xs uppercase tracking-wider text-[#5b6b62] dark:text-[#93a69b] sticky top-0">
                <th className="py-3 px-3.5 w-14 text-center border-b border-[#dfe7e1] dark:border-[#233229]">No</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Nama</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Jenjang</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Kelas</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Kampus</th>
                <th className="py-3 px-3.5 text-left border-b border-[#dfe7e1] dark:border-[#233229]">Waktu</th>
                <th className="py-3 px-3.5 text-right font-extrabold text-[#0f6b4a] dark:text-[#4fc08f] border-b border-[#dfe7e1] dark:border-[#233229]">Nilai</th>
                <th className="py-3 px-3.5 text-center border-b border-[#dfe7e1] dark:border-[#233229]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => {
                  const [jenjang, noInJenjang, nama, kelas, kampus, waktu, nilai, isFinalis] = row
                  const displayNo =
                    selectedJenjang && !selectedCampus && !searchQuery && selectedStatus === '' ? noInJenjang : idx + 1
                  const isEliminated = isFinalis === 0

                  return (
                    <tr
                      key={`${jenjang}-${nama}-${kampus}-${idx}`}
                      className={`border-b border-[#dfe7e1] dark:border-[#233229] transition-colors hover:bg-[#e6f3ec] dark:hover:bg-[#173126] ${
                        isEliminated ? 'text-[#5b6b62] dark:text-[#93a69b]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-center text-xs text-[#5b6b62] dark:text-[#93a69b]">
                        {displayNo}
                      </td>
                      <td className={`py-2.5 px-3.5 min-w-[180px] ${isEliminated ? 'font-medium' : 'font-semibold text-[#14231c] dark:text-[#e8f0eb]'}`}>
                        {nama}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-block text-xs font-bold text-[#0f6b4a] dark:text-[#4fc08f] bg-[#e6f3ec] dark:bg-[#173126] px-2.5 py-0.5 rounded-full">
                          Jenjang {jenjang}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        {kelas}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {kampus}
                      </td>
                      <td className="py-2.5 px-3.5 text-xs text-[#5b6b62] dark:text-[#93a69b]">
                        {waktu}
                      </td>
                      <td className={`py-2.5 px-3.5 text-right font-extrabold ${
                        isEliminated ? 'text-[#5b6b62] dark:text-[#93a69b]' : 'text-[#0f6b4a] dark:text-[#4fc08f]'
                      }`}>
                        {nilai}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        {isFinalis === 1 ? (
                          <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0f6b4a] dark:bg-[#4fc08f] text-white dark:text-[#0d1511]">
                            Finalis
                          </span>
                        ) : (
                          <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Eliminated
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-[#5b6b62] dark:text-[#93a69b] py-9">
                    Tidak ada peserta yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
