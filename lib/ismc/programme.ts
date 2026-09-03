// IASMCON 2026 scientific programme — mirrors the printed brochure schedule
// (IASMCON_2026 schedule, pages 5–13). Downloadable PDF: /brochures/iasmcon-2026-programme.pdf
// Row kinds: { chairs } = chairpersons line, { brk } = break, else a talk.

export type ProgRow =
  | { chairs: string }
  | { brk: string }
  | { time: string; topic: string; faculty?: string };

export type ProgSession = { theme: string; time: string; rows: ProgRow[] };
export type ProgHall = { name: string; sessions: ProgSession[]; note?: string };
export type ProgDay = {
  id: string;
  label: string;
  date: string;
  kind: string;
  venue?: string;
  halls: ProgHall[];
};

export const programme: ProgDay[] = [
  {
    id: 'day1',
    label: 'Day 1',
    date: '4 September 2026',
    kind: 'Pre-Conference Hands-on Workshop',
    venue: 'Yashoda Hospital, Secunderabad — 9th Floor, Auditorium 1',
    halls: [
      {
        name: 'Workshop',
        note: 'Workshop bookings · +91 98664 67677',
        sessions: [
          {
            theme: 'Advanced Shoulder Rehab & Return to Sport',
            time: '9:30 AM – 6:00 PM',
            rows: [
              { time: '9:30 – 10:00', topic: 'Sports Biomechanics of the Shoulder', faculty: 'Dr. Muthukumar Jothilingam' },
              { time: '10:00 – 10:45', topic: 'Sports Specific Shoulder Assessment – Practicals', faculty: 'Dr. Muthukumar Jothilingam' },
              { brk: 'Tea Break · 10:45 – 11:00 AM' },
              { time: '11:00 – 11:45', topic: 'Conservative Shoulder Management', faculty: 'Dr. Naga Sumanth' },
              { time: '11:45 – 12:30', topic: 'Shoulder Taping', faculty: 'Dr. Earnest Vijay Pandian' },
              { time: '12:30 – 1:00', topic: 'RTP Shoulder Criteria', faculty: 'Dr. Naga Sumanth' },
              { brk: 'Lunch Break · 1:00 – 2:00 PM' },
              { time: '2:00 – 3:00', topic: 'Clinical Case Discussion', faculty: 'Dr. Naga Sumanth & Dr. Earnest Vijay Pandian' },
              { time: '3:00 – 3:45', topic: 'Manual therapy of the shoulder', faculty: 'Dr. Earnest Vijay Pandian' },
              { brk: 'Tea Break · 3:45 – 4:00 PM' },
              { time: '4:00 – 6:00', topic: 'Return to Play Rehab', faculty: 'Dr. Muthukumar Jothilingam' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'day2',
    label: 'Day 2',
    date: '5 September 2026',
    kind: 'Conference',
    halls: [
      {
        name: 'Hall A',
        note: '6:30 PM · General Body Meeting',
        sessions: [
          {
            theme: 'ACL Tears',
            time: '9:00 AM – 1:20 PM',
            rows: [
              { chairs: 'Dr Ramesh, Dr Bhupin Singh' },
              { time: '9:00 – 9:15', topic: 'Biomechanics of ACL Tear', faculty: 'Dr. Trishala Singh' },
              { time: '9:15 – 9:30', topic: 'Prevention of ACL Injuries', faculty: 'Dr. Thiagarajan Alwar' },
              { time: '9:30 – 9:45', topic: 'Return to performance after ACL reconstruction: Is it possible', faculty: 'Dr. Tuhina Sharma' },
              { time: '9:45 – 10:00', topic: 'ACL repair – The new paradigm in ACL treatments', faculty: 'Dr. Vikram Sharma' },
              { time: '10:00 – 10:15', topic: 'ACL – lateral stabilization techniques: when and why', faculty: 'Dr. Sai Veerla' },
              { time: '10:15 – 10:30', topic: 'Partial ACL tear – The reality and long term outcomes', faculty: 'Dr. Jai Krishna Reddy' },
              { time: '10:30 – 10:45', topic: 'Protective vs Accelerated rehab after ACL surgery: Evidence and retear rates', faculty: 'Dr. Ramana Kameshwaran' },
              { time: '10:45 – 11:00', topic: 'Neuroplasticity after ACL tears: Why the brain matters as much as the knee', faculty: 'Dr. Madhavi' },
              { brk: 'Tea Break · 11:00 – 11:15 AM' },
              { chairs: 'Dr Ajay Singh Thakur, Dr Kaushik Reddy' },
              { time: '11:15 – 11:30', topic: 'Relive Surgery: ACL reconstruction types – All Inside, BTB, Synthetic', faculty: 'Dr. Purnachandra Tejeswi' },
              { time: '11:30 – 11:45', topic: 'ACL Retears: Why our RTS programmes are failing us', faculty: 'Dr. Earnest Vijay Pandian' },
              { time: '11:45 – 12:00', topic: 'ACL tear in Elite Athletes: How I treat them', faculty: 'Dr. Dinshaw Noshir Pardiwala' },
              { time: '12:00 – 12:15', topic: 'Plyometric Progression: Rehab to Performance', faculty: 'Dr. Muthukumar Jothilingam' },
              { time: '12:15 – 12:40', topic: 'Panel Discussion: Multiligament injuries – Multidisciplinary', faculty: 'Dr. Sunil Apsingi' },
              { time: '12:40 – 1:00', topic: 'IASM President Oration', faculty: 'Dr. Sachin Tapasvi' },
              { time: '1:00 – 1:20', topic: 'Inauguration' },
              { brk: 'Lunch · 1:20 – 2:00 PM' },
            ],
          },
          {
            theme: 'Sports Nutrition',
            time: '2:00 – 5:30 PM',
            rows: [
              { chairs: 'Dr Sai Veerla' },
              { time: '2:00 – 2:10', topic: 'Long term results of Gel-based ACI in young patients', faculty: 'Dr. Dinshaw Noshir Pardiwala' },
              { time: '2:10 – 2:20', topic: 'Energy Balance: Understanding REDS', faculty: 'Dr. Keren Harish Tiwari' },
              { time: '2:20 – 2:30', topic: 'Energy Availability, REDS & Clinical Consequences', faculty: 'Dr. Keren Harish Tiwari' },
              { time: '2:30 – 2:40', topic: 'Nutrition & Multidisciplinary management in REDS', faculty: 'Dr. Rohini Raman' },
              { time: '2:40 – 2:50', topic: 'Nutrition Periodisation in Sports', faculty: 'Dr. Kommi Kalpana' },
              { time: '2:50 – 3:00', topic: 'Individualised nutrient strategies across sports', faculty: 'Ms. Kota Lavanya' },
              { time: '3:00 – 3:10', topic: 'Hydration, Electrolytes & Thermoregulation', faculty: 'Ms. Ishani Ghotikar' },
              { time: '3:10 – 3:20', topic: 'Evidence based supplements & Ergogenic aids in Sports', faculty: 'Dr. Anup Krishnan' },
              { time: '3:20 – 3:30', topic: 'Q & A' },
              { brk: 'Tea Break · 3:30 – 3:40 PM' },
              { chairs: 'Dr Kalpana Kommi, Dr Ramana' },
              { time: '3:40 – 3:50', topic: 'Gut–Exercise Axis: Microbiome, Nutrition, Performance', faculty: 'Dr. Mahenderan Appukutty' },
              { time: '3:50 – 4:00', topic: 'Genotype to Phenotype: Mapping individual variability in sports', faculty: 'Dr. Mahenderan Appukutty' },
              { time: '4:00 – 4:10', topic: 'Integrating Biomarkers, Multi Omics & AI into personalized nutrition and training', faculty: 'Dr. Chathyushya K B' },
              { time: '4:10 – 4:20', topic: 'Pre-Practice daily nutrition prescription', faculty: 'Ms. Lakma Akhila' },
              { time: '4:20 – 4:30', topic: 'Post match nutrition requirements', faculty: 'Ms. Lakma Akhila' },
              { time: '4:30 – 4:40', topic: 'Q & A' },
              { time: '4:40 – 5:30', topic: 'Live Demo & Workshop: Return to sports after ACL injuries', faculty: 'Dr. Vaibhav Daga' },
            ],
          },
        ],
      },
      {
        name: 'Hall B',
        sessions: [
          {
            theme: 'Lower Limb',
            time: '9:00 AM – 1:20 PM',
            rows: [
              { chairs: 'Dr Valaya, Dr Raja Ramesh' },
              { time: '9:00 – 9:15', topic: 'Patellofemoral pain: Anatomy & Biomechanics behind the pathology', faculty: 'Dr. Vamshi Krishna Terala' },
              { time: '9:15 – 9:30', topic: 'Acute patellar dislocation – management on field and in the immediate aftermath', faculty: 'Dr. Aparna Kondapalli' },
              { time: '9:30 – 9:45', topic: 'MRI vs Ultrasound in Sports Injuries', faculty: 'Dr. Srinath Boppana' },
              { time: '9:45 – 10:00', topic: 'Algorithm for patellar instability – Relive Surgery: MPFL reconstruction', faculty: 'Dr. Jayaprasad' },
              { time: '10:00 – 10:15', topic: 'Applications of EMG in sports rehabilitation', faculty: 'Prof. Dr. Shweta Shenoy' },
              { time: '10:15 – 10:30', topic: 'Principles of rehabilitation after patellar stabilizing surgery', faculty: 'Dr. Sripada Pallavi' },
              { time: '10:30 – 10:45', topic: 'Chondromalacia Patella: Treatment modalities', faculty: 'Dr. Sujit Kumar' },
              { time: '10:45 – 11:00', topic: 'Managing Osgood-Schlatter and Sinding-Larsen-Johansson diseases in young competitive athletes', faculty: 'Dr. Kapilchand' },
              { brk: 'Tea Break · 11:00 – 11:15 AM' },
              { chairs: 'Dr Sravan' },
              { time: '11:15 – 11:30', topic: 'Fascia in Sports: Separating science from social media', faculty: 'Dr. Chandana' },
              { time: '11:30 – 11:45', topic: 'Shin splints in runners: Treatment strategies', faculty: 'Dr. Anup Krishnan' },
              { time: '11:45 – 12:00', topic: 'Runners & Gait analysis: Utmost importance', faculty: 'Dr. Ajit Sitaram Mapari' },
              { time: '12:00 – 12:15', topic: 'Hamstring injuries: Risk management plans in prevention & treatment modalities', faculty: 'Dr. Prabu Raja G' },
              { time: '12:15 – 12:30', topic: 'The Calf Injury: Patterns & Management', faculty: 'Dr. Koushik' },
              { time: '12:30 – 12:40', topic: 'Q & A Session' },
              { time: '12:40 – 1:20', topic: 'President Oration & Inauguration in Hall A' },
              { brk: 'Lunch · 1:20 – 2:00 PM' },
            ],
          },
          {
            theme: 'Regenerative / Cartilage',
            time: '2:00 – 4:00 PM',
            rows: [
              { chairs: 'Dr Alwal Reddy' },
              { time: '2:00 – 2:15', topic: 'Clinical efficacy of PRP therapy and Prolotherapy in Sports Injuries', faculty: 'Dr. C Mahesh' },
              { time: '2:15 – 2:30', topic: 'Evaluating bone marrow aspirate concentrate (BMAC) in sports injuries', faculty: 'Dr. Krishna Subramaniam' },
              { time: '2:30 – 2:45', topic: 'Allogenic Mesenchymal stem cells & usage in Orthopaedics', faculty: 'Dr. Koteshwara Prasad' },
              { time: '2:45 – 3:00', topic: 'MRI in cartilage lesions and interpreting the results after regenerative therapies', faculty: 'Dr. Sanjay Mukund Desai' },
              { time: '3:00 – 3:15', topic: 'Role of Exosomes in Sports Injuries', faculty: 'Dr. Prabhat Lakkireddy' },
              { time: '3:15 – 3:30', topic: 'Role of osteochondral grafts in athletes and their outcomes', faculty: 'Dr. Raviteja Rudraraju' },
              { time: '3:30 – 3:45', topic: 'Why cartilage repair fails: Importance of Alignment & Biomechanics', faculty: 'Dr. Anoop Reddy' },
              { brk: 'Tea Break · 3:45 – 4:00 PM' },
            ],
          },
          {
            theme: 'Exercise Physiology',
            time: '4:00 – 5:00 PM',
            rows: [
              { chairs: 'Dr Srikanth, Dr Sukesh' },
              { time: '4:00 – 4:10', topic: 'Recent advances in cardiorespiratory response to exercise', faculty: 'Dr. MVL Suryakumari' },
              { time: '4:10 – 4:20', topic: 'Metabolic response to acute & chronic exercise', faculty: 'Dr. MVL Suryakumari' },
              { time: '4:20 – 4:30', topic: 'Recovery, Supercompensation & Adaptation', faculty: 'Dr. Snehunsu Adhikari' },
              { time: '4:30 – 4:40', topic: 'Physiological testing & Performance Assessment', faculty: 'Dr. Subrata Dey' },
              { time: '4:40 – 4:50', topic: 'Wearable technology: AI in real time athlete monitoring', faculty: 'Dr. Antony Wilson Chacko' },
              { time: '4:50 – 5:00', topic: 'Performance analysis in sports: From data to decision making', faculty: 'Dr. Harish Kumar Tiwari' },
              { brk: 'Industry Sponsored Workshop · 5:00 – 6:00 PM' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'day3',
    label: 'Day 3',
    date: '6 September 2026',
    kind: 'Conference',
    halls: [
      {
        name: 'Hall A',
        sessions: [
          {
            theme: 'The Shoulder',
            time: '9:00 AM – 1:00 PM',
            rows: [
              { chairs: 'Dr Sunil Apsingi, Dr Anoop Reddy' },
              { time: '9:00 – 9:15', topic: 'The Vulnerable Shoulder: Mapping the complex relationship between mobility, stability and force transfer in sports persons', faculty: 'Dr. Earnest Vijay Pandian' },
              { time: '9:15 – 9:30', topic: 'Glenohumeral Internal Rotation Deficit (GIRD) and other problems in overhead athletes', faculty: 'Dr. Rajesh' },
              { time: '9:30 – 9:45', topic: 'On-field management of acute shoulder dislocations', faculty: 'Dr. Ajay Paruchuri' },
              { time: '9:45 – 10:00', topic: 'Managing the Multidirectional Instability', faculty: 'Dr. Tuhina Sharma' },
              { time: '10:00 – 10:15', topic: 'Arthroscopic Bankart repair – Relive Surgery', faculty: 'Dr. Inderdeep Singh' },
              { time: '10:15 – 10:30', topic: 'Scapulothoracic abnormal mobility and its management', faculty: 'Dr. Sukesh Rao' },
              { time: '10:30 – 10:45', topic: 'Management of partial cuff tears in athletes', faculty: 'Dr. Samala Prashanthi' },
              { time: '10:45 – 11:00', topic: 'Rotator cuff repairs & Patches: Relive Surgery', faculty: 'Dr. Chandra Shekar Bodanki' },
              { time: '11:00 – 11:15', topic: 'Rehabilitation protocols after rotator cuff repair', faculty: 'Dr. Sravan Kumar' },
              { time: '11:15 – 11:30', topic: 'The pathology of frozen shoulder & biomechanics', faculty: 'Prof. Maj. Dr. Bakhtiar Choudary' },
              { time: '11:30 – 12:00', topic: 'Case based discussions & Panel Discussion', faculty: 'Dr. Deepthi Nandan' },
              { brk: 'Tea Break · 12:00 – 12:15 PM' },
              { time: '12:15 – 12:30', topic: 'Parasports Classification: Contemporary Frameworks & Challenges in Competitive Sports', faculty: 'Dr. Sri Padmini Chennapragada' },
              { time: '12:30 – 12:45', topic: 'Management of Parasports: Integrating Classification, Athlete Development and Performance Systems in India', faculty: 'Dr. Sri Padmini Chennapragada' },
              { time: '12:45 – 1:00', topic: 'Counselling post-injury to improve performance', faculty: 'Dr. Veerendra Chennoju' },
              { brk: 'Lunch · 1:15 – 2:00 PM' },
            ],
          },
          {
            theme: 'Ankle & Foot',
            time: '2:00 – 4:30 PM',
            rows: [
              { chairs: 'Dr Amruth Raj, Dr Yashwanth' },
              { time: '2:00 – 2:15', topic: 'Ankle instability and ATFL tear management', faculty: 'Dr. Hariprakash' },
              { time: '2:15 – 2:30', topic: 'Ankle Impingement: Diagnosis and Management', faculty: 'Dr. Shashikanth' },
              { time: '2:30 – 2:45', topic: 'Achilles Mid-Tendon vs Insertional Tendinopathy: Rehab variations', faculty: 'Dr. Naga Sumanth' },
              { time: '2:45 – 3:00', topic: 'Predictive Analytics in Athlete Performance', faculty: 'Mr. Praveen Vemuri' },
              { brk: 'Tea Break · 3:00 – 3:15 PM' },
              { chairs: 'Dr Bhargav, Dr Naveen Reddy' },
              { time: '3:15 – 3:30', topic: 'Maximizing RTP after Achilles tendon injury', faculty: 'Dr. Minash Gabriel' },
              { time: '3:30 – 3:45', topic: "Plantar fasciitis – What's new: Evidence based", faculty: 'Dr. Sitaram' },
              { time: '3:45 – 4:00', topic: 'The future of athlete care: AI, Variables & Data Analytics', faculty: 'Dr. Rajesh Kumar' },
              { time: '4:00 – 4:15', topic: 'Running shoes and Podiatry support: Taking care of the endurance athlete', faculty: 'Dr. Rishikesh' },
              { time: '4:15 – 4:30', topic: 'Case based discussions', faculty: 'Dr. Jagan Mohan Reddy' },
            ],
          },
        ],
      },
      {
        name: 'Hall B',
        sessions: [
          {
            theme: 'Sports Physio',
            time: '9:00 AM – 12:15 PM',
            rows: [
              { chairs: 'Dr Laxminarsimhulu, Dr Raghupathi Rao' },
              { time: '9:00 – 9:15', topic: 'Evaluating the pillars of effective rehabilitation and making the best decision on RTP', faculty: 'Dr. Amrinder Singh' },
              { time: '9:15 – 9:30', topic: 'Use of Tech and AI in fitness evaluation', faculty: 'Dr. Ajit Mapari' },
              { time: '9:30 – 9:45', topic: 'ACL + PCL Reconstruction: Relive Surgery', faculty: 'Dr. Ajay Singh Thakur' },
              { time: '9:45 – 10:00', topic: 'Genetics & Injury Susceptibility', faculty: 'Dr. Rajesh Reddy' },
              { time: '10:00 – 10:15', topic: 'Tendon mechanobiology: Cellular level changes during loading', faculty: 'Dr. Harini Vemuri' },
              { time: '10:15 – 10:30', topic: 'Isometrics in rehab: When & how to dose them', faculty: 'Dr. Prabu Raja G' },
              { time: '10:30 – 10:45', topic: 'Common injuries in professional cricket – My experience', faculty: 'Dr. Pavan Kumar Talapur' },
              { time: '10:45 – 11:00', topic: 'Return to Play & Return to Performance: How they differ', faculty: 'Dr. Nino Severino' },
              { brk: 'Tea Break · 11:00 – 11:15 AM' },
              { chairs: 'Dr Praveen, Dr Rahmath' },
              { time: '11:15 – 11:30', topic: 'Fatigue monitoring: Subjective & Objective markers', faculty: 'Dr. Suman' },
              { time: '11:30 – 11:45', topic: 'Eccentric Loading: Why & How it works', faculty: 'Dr. Sudheer Reddy' },
              { time: '11:45 – 12:00', topic: 'Isokinetics: The practical usage in sports rehab', faculty: 'Dr. Deepak Kumar Pradhan' },
              { time: '12:00 – 12:15', topic: 'Beyond the medal: Building a high performance sports ecosystem', faculty: 'Karthik Y' },
            ],
          },
          {
            theme: 'Doping in Sports',
            time: '12:15 – 1:30 PM',
            rows: [
              { chairs: 'Dr Rahul Gulve, Dr Naveen Munna' },
              { time: '12:15 – 12:30', topic: 'Clinical reasoning in an elite cricket setup – The 1% decisions', faculty: 'Dr. Prasanth' },
              { time: '12:30 – 12:45', topic: 'Consequences of unregulated supplement use in sports', faculty: 'Dr. Alka Beotra' },
              { time: '12:45 – 1:00', topic: 'Travelling as a Team Doctor: How to be prepared – my experience', faculty: 'Dr. Rajesh Gupta' },
              { time: '1:00 – 1:15', topic: 'WADA guidelines update 2026', faculty: 'Dr. Alka Beotra' },
              { time: '1:15 – 1:30', topic: 'Introducing Sports Pharmacy: A new concept in Antidoping', faculty: 'Dr. Sivakumar Kannan' },
              { brk: 'Lunch · 1:30 – 2:00 PM' },
            ],
          },
          {
            theme: 'Elbow & Hip',
            time: '2:00 – 4:45 PM',
            rows: [
              { chairs: 'Dr Vandana, Dr Kiran' },
              { time: '2:00 – 2:15', topic: "Lateral epicondylitis – the wrist isn't the whole story", faculty: 'Dr. Yarramala Muneiah' },
              { time: '2:15 – 2:30', topic: 'Medial elbow pain – management strategies for best outcomes', faculty: 'Dr. Rajesh' },
              { time: '2:30 – 2:45', topic: 'Clinical Pilates in Sports Rehabilitation', faculty: 'Dr. Chandana' },
              { time: '2:45 – 3:00', topic: 'Proximal & Distal biceps tendon ruptures – how to manage', faculty: 'Dr. Kaushik Reddy' },
              { time: '3:00 – 3:15', topic: 'Valgus extension overload injuries of the elbow', faculty: 'Dr. Deepak Kumar Pradhan' },
              { time: '3:15 – 3:30', topic: 'Traumatic elbow dislocation: On-field management', faculty: 'Dr. Sai Phani Chandra' },
              { brk: 'Tea Break · 3:30 – 3:45 PM' },
              { chairs: 'Dr Vishnuvardhan Rao, Dr Sudheeshna' },
              { time: '3:45 – 4:00', topic: 'Femoro Acetabular Impingement & Labrum tears', faculty: 'Dr. Lalith Mohan' },
              { time: '4:00 – 4:15', topic: 'Osteitis Pubis: Treatment strategies', faculty: 'Dr. Veda Prakash' },
              { time: '4:15 – 4:30', topic: 'Groin pull / Strain: Return to play', faculty: 'Dr. Pallabi Nandi' },
              { time: '4:30 – 4:45', topic: 'Impact of various exercise training on arterial health of athletes', faculty: 'Dr. Deekshitha' },
            ],
          },
        ],
      },
    ],
  },
];
