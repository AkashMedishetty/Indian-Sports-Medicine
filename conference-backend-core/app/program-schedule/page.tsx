"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { 
  Calendar, Clock, MapPin, Users, Download, Search,
  User, Coffee, Video, HelpCircle, Award, BookOpen, Mic, Star
} from "lucide-react"
import { toast } from "sonner"

// Helper function to generate ICS calendar file
const generateICS = (dayLabel: string, date: string, modules: Module[]) => {
  let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ISSH 2026//EN\n'
  
  modules.forEach((mod) => {
    const [startTime] = mod.time.split(' - ')
    const [endTime] = mod.time.split(' - ').slice(1)
    
    const formatTime = (timeStr: string, dateStr: string) => {
      const d = new Date(dateStr)
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
      if (!match) return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      let hours = parseInt(match[1])
      const mins = parseInt(match[2])
      const ampm = match[3]
      if (ampm?.toUpperCase() === 'PM' && hours !== 12) hours += 12
      if (ampm?.toUpperCase() === 'AM' && hours === 12) hours = 0
      d.setHours(hours, mins, 0)
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    icsContent += 'BEGIN:VEVENT\n'
    icsContent += `DTSTART:${formatTime(startTime, date)}\n`
    icsContent += `DTEND:${formatTime(endTime || startTime, date)}\n`
    icsContent += `SUMMARY:${mod.module}\n`
    icsContent += `DESCRIPTION:${mod.chairs ? 'Chairs: ' + mod.chairs : ''}\n`
    icsContent += `LOCATION:HICC Novotel, Hyderabad\n`
    icsContent += 'END:VEVENT\n'
  })
  
  icsContent += 'END:VCALENDAR'
  return icsContent
}

const downloadICS = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

interface Talk {
  time: string
  type: string
  title: string
  faculty: string
}

interface Module {
  module: string
  time: string
  chairs: string
  talks: Talk[]
}

// Programme data extracted from ISSH Scientific Programme PDF
const programmeData = {
  overview: {
    day1: [
      { time: '08:00AM - 09:00AM', hallA: 'Registration', hallB: 'Registration' },
      { time: '08:50AM - 09:00AM', hallA: 'Welcome Address & Theme Introduction', hallB: '' },
      { time: '09:00AM - 10:00AM', hallA: 'Fingertip Injuries', hallB: 'Free Paper Presentations (FP-01)' },
      { time: '10:00AM - 11:00AM', hallA: 'Phalangeal & Metacarpal Fractures', hallB: 'Free Paper Presentations (FP-02)' },
      { time: '11:00AM - 11:30AM', hallA: 'Inauguration Ceremony & Coffee Break', hallB: 'Coffee Break' },
      { time: '11:30AM - 12:30PM', hallA: 'Compressive Neuropathies', hallB: 'Free Paper Presentations (FP-03)' },
      { time: '12:30PM - 01:30PM', hallA: 'PIP & DIP Fractures and Dislocations', hallB: 'Free Paper Presentations (FP-04)' },
      { time: '01:30PM - 02:15PM', hallA: 'Lunch Break', hallB: 'Lunch Break' },
      { time: '02:15PM - 03:15PM', hallA: 'Traumatic Brachial Plexus Injuries', hallB: 'Meet the Mentors — Fellowship Guidance' },
      { time: '03:15PM - 05:15PM', hallA: 'Carpal Injuries & Dislocations', hallB: 'E-Poster Presentation' },
      { time: '04:15PM - 04:45PM', hallA: 'Coffee Break', hallB: 'Coffee Break' },
      { time: '04:45PM - 05:45PM', hallA: 'Post Burn Hand Deformity Reconstruction', hallB: '' },
      { time: '05:45PM - 06:15PM', hallA: 'Pearls from Pioneers', hallB: '' },
      { time: '06:15PM - 06:45PM', hallA: 'Scalpel to Soul: LIVE PODCAST with Dr. SRS', hallB: '' },
      { time: '07:30PM - 11:30PM', hallA: 'Royal Nizami Night — Gala Banquet', hallB: '' },
    ],
    day2: [
      { time: '08:00AM - 09:00AM', hallA: 'Medal Paper Presentations', hallB: 'Free Paper Presentations (FP-05)' },
      { time: '09:00AM - 10:00AM', hallA: 'Scaphoid Fractures', hallB: 'Precision Matters' },
      { time: '10:00AM - 11:00AM', hallA: 'Peripheral Nerve Injuries', hallB: 'Additional Insights' },
      { time: '11:00AM - 11:30AM', hallA: 'Coffee Break', hallB: 'Coffee Break' },
      { time: '11:30AM - 12:30PM', hallA: 'Distal Radius Fractures', hallB: 'Relive Videos of Every Day Surgeries' },
      { time: '12:30PM - 01:30PM', hallA: 'Tendon Injuries', hallB: '' },
      { time: '01:30PM - 02:00PM', hallA: 'Valedictory Ceremony', hallB: '' },
      { time: '02:00PM - 02:30PM', hallA: 'Lunch Break', hallB: 'Lunch Break' },
      { time: '02:30PM - 05:30PM', hallA: 'Hands-On Workshops (Distal Radius & Metacarpal Saw Bone)', hallB: 'Tendon Repair Workshop over Porcine Tendons' },
    ]
  },
  day1HallA: [
    { module: 'Module 1: Fingertip Injuries — Precision Starts at the Tip', time: '09:00AM - 10:00AM', chairs: 'Dr. Mukund Thatte, Dr. V.S. Ravindranath, Dr. Hemanth Kumar', talks: [
      { time: '09:00 - 09:05', type: 'Anatomy', title: 'FORM MEETS FUNCTION: Understanding the Fingertip and Injuries', faculty: 'Dr Jammula S Srinivas, Hyderabad' },
      { time: '09:05 - 09:15', type: 'Inappropriate', title: 'WHEN TIP INJURIES GO WRONG: Common Mistakes in Fingertip Injuries', faculty: 'Dr Rajendra Nehete, Nashik' },
      { time: '09:15 - 09:25', type: 'Appropriate', title: 'DOING IT RIGHT: Basic Principles for Safe Fingertip Reconstruction', faculty: 'Dr Subashini, Chennai' },
      { time: '09:25 - 09:35', type: 'Most Appropriate', title: 'OPTIMIZING FORM, FUNCTION AND SENSATION: Next-level Fingertip Reconstruction', faculty: 'Dr Raja Tiwari, New Delhi' },
      { time: '09:35 - 09:45', type: 'Video', title: 'V-Y Advancement Flap, Cross Finger Flap and Moberg Flap', faculty: 'Dr Binoy P S, Kochi' },
      { time: '09:45 - 09:55', type: 'Video', title: 'Oblique Triangular Flap and Littler\'s Neurovascular Island Flap', faculty: 'Dr Abhinandan, Hyderabad' },
      { time: '09:55 - 10:00', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 2: Phalangeal & Metacarpal Fractures — Align It, Secure It', time: '10:00AM - 11:00AM', chairs: 'Dr. Pankaj Ahire, Dr. Moorthy G.V.S, Dr. Srinivas Bachu', talks: [
      { time: '10:00 - 10:05', type: 'Anatomy', title: 'BUILT TO MOVE: Functional Anatomy and X-rays for Finger and Hand Fractures', faculty: 'Dr Dheeraj, Hyderabad' },
      { time: '10:05 - 10:15', type: 'Inappropriate', title: 'WHEN FIXATION FAILS: Common Errors in Phalangeal and Metacarpal Fracture Fixation', faculty: 'Dr Srinivasan Rajappa, Chennai' },
      { time: '10:15 - 10:25', type: 'Appropriate', title: 'STABILITY WITHOUT STIFFNESS: Principles of Non-operative and K wire fixation', faculty: 'Dr Madhusudhan NC, Bangalore' },
      { time: '10:25 - 10:35', type: 'Most Appropriate', title: 'PRECISION FIXATION FOR EARLY MOTION: Modern concepts in Phalangeal and Metacarpal fixation', faculty: 'Dr Arya Roy, Kolkata' },
      { time: '10:35 - 10:45', type: 'Video', title: 'K Wire Fixation and Plating Techniques of Phalangeal Fractures', faculty: 'Dr Ajeesh Sankaran, Calicut' },
      { time: '10:45 - 10:55', type: 'Video', title: 'K wire fixation and Plating Techniques of Metacarpal Fractures', faculty: 'Dr Mithun Pai, Mangalore' },
      { time: '10:55 - 11:00', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 3: Compression Neuropathies — Pressure Off, Power Back', time: '11:30AM - 12:30PM', chairs: 'Dr. Ravi Ganesh Bharadwaj, Dr. Srikanth R, Dr. P. Chandrasekhar', talks: [
      { time: '11:30 - 11:35', type: 'Anatomy', title: 'NERVES UNDER PRESSURE: Anatomy of Tunnels and Sites of Compression', faculty: 'Dr Manesh Jain, Hyderabad' },
      { time: '11:35 - 11:45', type: 'Inappropriate', title: 'WHEN PRESSURES ARE MISSED: Delayed Diagnosis and Preventable Nerve Damage', faculty: 'Dr Praveen Bhardwaj, Coimbatore' },
      { time: '11:45 - 11:55', type: 'Appropriate', title: 'RIGHT DIAGNOSIS, RIGHT RELEASE: Algorithm for Upper limb Compression Neuropathies', faculty: 'Dr Suneel R, Hyderabad' },
      { time: '11:55 - 12:05', type: 'Most Appropriate', title: 'PRECISION DECOMPRESSION: Expert Techniques and Minimally Invasive Options', faculty: 'Dr Srinivasan Rajappa, Chennai' },
      { time: '12:05 - 12:15', type: 'Video', title: 'Open and Endoscopic Carpal Tunnel Release', faculty: 'Prof Anil K Bhat, Manipal' },
      { time: '12:15 - 12:25', type: 'Video', title: 'Cubital Tunnel Release and Transposition of Ulnar Nerve', faculty: 'Dr Avinash G Rao, Hyderabad' },
      { time: '12:25 - 12:30', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 4: DIP & PIP Joint Fractures — Small Joints, Big Consequences', time: '12:30PM - 01:30PM', chairs: 'Dr. Srinivasan Rajappa, Dr. Thimma Reddy, Dr. J. Alwal Reddy', talks: [
      { time: '12:30 - 12:35', type: 'Anatomy', title: 'MILLIMETER MATTERS: PIP and DIP JOINT Anatomy and Radiology', faculty: 'Dr Sandeep Sriram, Hyderabad' },
      { time: '12:35 - 12:45', type: 'Inappropriate', title: 'WHEN JOINT LOSES THE PLOT: Missed Injuries and Preventable Stiffness', faculty: 'Dr Samuel Pallapatti, Vellore' },
      { time: '12:45 - 12:55', type: 'Appropriate', title: 'RESPECT THE JOINT: Principle Based Management of DIP and PIP Fractures', faculty: 'Dr Amit Vyas, Jaipur' },
      { time: '12:55 - 01:05', type: 'Most Appropriate', title: 'RESTORE, STABILISE, MOBILISE: Hemihamate, Volar plate arthroplasty, Joint Replacement', faculty: 'Dr Sreekanth Raveendran, Tamil Nadu' },
      { time: '01:05 - 01:15', type: 'Video', title: 'Hemi-Hamate Arthroplasty and Volar Plate Interposition Arthroplasty', faculty: 'Dr Gopinath Bandari, Hyderabad' },
      { time: '01:15 - 01:25', type: 'Video', title: 'Suzuki External Fixator and Ishiguro Extension Block Pinning', faculty: 'Dr Bipin Ghanghurde, Mumbai' },
      { time: '01:25 - 01:30', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 5: Traumatic Brachial Plexus Injuries — Big Injury, Bold Strategy', time: '02:15PM - 03:15PM', chairs: 'Dr. Mukund Thatte, Dr. Rajendra Nehete, Dr. Bharatendu Swain', talks: [
      { time: '02:15 - 02:20', type: 'Anatomy', title: 'THE POWER NETWORK: Roots, Trunks, Divisions, Cords and Branches', faculty: 'Dr Parag Lad, Mumbai' },
      { time: '02:20 - 02:30', type: 'Inappropriate', title: 'WHEN DIAGNOSIS AND TIME IS LOST: Wrong Tests, Delayed Referral', faculty: 'Dr Sunil Gaba, Chandigarh' },
      { time: '02:30 - 02:40', type: 'Appropriate', title: 'RIGHT TIMING, RIGHT PATHWAY: Evaluation and Referral For BPI', faculty: 'Dr Vigneswaran V, Coimbatore' },
      { time: '02:40 - 02:50', type: 'Most Appropriate', title: 'REWIRING FUNCTION: Nerve Reconstruction, Transfers, and Secondary Procedures', faculty: 'Dr Bharat Kadadi, Bangalore' },
      { time: '02:50 - 03:00', type: 'Video', title: 'Exploration of Plexus, Nerve Repair, Nerve Transfers', faculty: 'Dr Praveen Bhardwaj, Coimbatore' },
      { time: '03:00 - 03:10', type: 'Video', title: 'Free Functioning Muscle Transfer in BPI', faculty: 'Dr Srikanth R, Hyderabad' },
      { time: '03:10 - 03:15', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 6: Carpal Injuries & Dislocations — Small Shift, Big Damage', time: '03:15PM - 04:15PM', chairs: 'Dr. Praveen Bhardwaj, Dr. Ramkumar Reddy, Dr. Srinivas Thati', talks: [
      { time: '03:15 - 03:20', type: 'Anatomy', title: 'THE CARPAL JIGSAW PUZZLE: Understanding Carpals and Radiological Alignment', faculty: 'Dr Srinadh Boppanna, Hyderabad' },
      { time: '03:20 - 03:30', type: 'Inappropriate', title: 'MISSED, MISREAD, MISMANAGED: Delayed Diagnosis and Compromised Outcomes', faculty: 'Prof Anil K Bhat, Manipal' },
      { time: '03:30 - 03:40', type: 'Appropriate', title: 'RECOGNISE EARLY, STABILISE RIGHT: Principle-Based Management of Carpal Injuries', faculty: 'Dr Shailesh Gupta, Indore' },
      { time: '03:40 - 03:50', type: 'Most Appropriate', title: 'RESTORING CARPAL-HARMONY: Next-level Reconstruction of Carpal Injuries', faculty: 'Dr Pankaj Ahire, Mumbai' },
      { time: '03:50 - 04:00', type: 'Video', title: 'Management of Lunate and Peri-Lunate Dislocations', faculty: 'Dr Vigneswaran V, Coimbatore' },
      { time: '04:00 - 04:10', type: 'Video', title: 'Open and Arthroscopic Scapho-Ligament Reconstruction', faculty: 'Dr Abhijeet Wahegaonkar, Pune' },
      { time: '04:10 - 04:15', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 7: Post Burn Hand Deformity — From Scar to Strength', time: '04:45PM - 05:45PM', chairs: 'Dr. Bhaskarananda Kumar, Dr. Karthikeyan G, Dr. Mani Kumari', talks: [
      { time: '04:45 - 04:50', type: 'Anatomy', title: 'KNOW THE LAYERS, SAVE THE FUNCTION: Anatomy in Hand Deformities', faculty: 'Dr Rohit Babu, Hyderabad' },
      { time: '04:50 - 05:00', type: 'Inappropriate', title: 'BURN BLUNDERS: Common Pitfalls in Post Burn Hand Reconstruction', faculty: 'Dr Umar Farooq Baba, Srinagar' },
      { time: '05:00 - 05:10', type: 'Appropriate', title: 'CONTRACTURE PREVENTION AND PRECISION PATCHING: Basic Techniques of Correction', faculty: 'Dr Palukuri Lakshmi, Hyderabad' },
      { time: '05:10 - 05:20', type: 'Most Appropriate', title: 'FREE THE CONTRACTURE, FIX THE FUNCTION: Expert Flaps and Microsurgical Procedures', faculty: 'Dr Bharatendu Swain, Hyderabad' },
      { time: '05:20 - 05:30', type: 'Video', title: 'Contracture Release and Skin Grafting of Hand Deformity Correction', faculty: 'Dr Sanjay Giri, Bhubaneswar' },
      { time: '05:30 - 05:40', type: 'Video', title: 'Groin and Abdominal Flap for Post Burn Hand Deformity Correction', faculty: 'Dr S Raja Sabapathy, Coimbatore' },
      { time: '05:40 - 05:45', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 8: Pearls from Pioneers — Wisdom from Experience', time: '05:45PM - 06:15PM', chairs: 'Prof. M.V. Reddy, Dr. Srikanth R, Dr. Vijay Chander Reddy', talks: [
      { time: '05:45 - 06:00', type: 'Pioneer', title: 'Creation of Thumb and Lessons Learnt in My Experience', faculty: 'Dr Bhaskaranand Kumar, Manipal' },
      { time: '06:00 - 06:15', type: 'Pioneer', title: 'Lessons Learnt in My 40 years\' Experience', faculty: 'Dr Mukund Thatte, Mumbai' },
    ]},
    { module: 'Scalpel to Soul — LIVE PODCAST with Dr. SRS', time: '06:15PM - 06:45PM', chairs: '', talks: [
      { time: '06:15 - 06:45', type: 'Special', title: 'Grippy and Gritty Conversations with Dr. Raja Sabapathy — Lessons Beyond the Operating Table', faculty: 'Dr S Raja Sabapathy' },
    ]},
  ] as Module[],
  day2HallA: [
    { module: 'Medal Paper Presentations', time: '08:00AM - 09:00AM', chairs: 'Dr. Praveen Bhardwaj, Prof. Anil K Bhat', talks: [
      { time: '08:00 - 08:10', type: 'Award', title: 'Is shoulder joint containment really necessary for glenohumeral abduction in BBPP?', faculty: 'Dr Kuldeep Rajendrabhai Parmar' },
      { time: '08:10 - 08:20', type: 'Award', title: 'E-DAF Treatment for Electrical burns upper limb — Analysis & Long-term results', faculty: 'Dr Lakshmi Palukuri' },
      { time: '08:20 - 08:30', type: 'Award', title: 'Pattern and Functional outcomes of ulnar nerve injuries: Surgical management', faculty: 'Dr Srinivasu Kondamudi' },
      { time: '08:30 - 08:40', type: 'Award', title: 'Beyond the Thoracic Outlet: Neurogenic TOS as a Spectrum of Multilevel Compression', faculty: 'Dr Balaji D' },
      { time: '08:40 - 08:50', type: 'Award', title: 'Functional and Radiological Outcomes of Distal Radius Bone Grafting for Scaphoid Nonunion', faculty: 'Dr Charan Kumar Reddy Lakkireddy' },
      { time: '08:50 - 09:00', type: 'Award', title: 'Evaluation of Arthroscopic and Open Techniques for Stiff Elbow', faculty: 'Dr Akshaj Tichkule' },
    ]},
    { module: 'Module 9: Scaphoid Fractures — Tiny Bone, Serious Consequences', time: '09:00AM - 10:00AM', chairs: 'Dr. Amit Vyas, Dr. Gopinath Bandari, Dr. Abhijeet Wahegaonkar', talks: [
      { time: '09:00 - 09:05', type: 'Anatomy', title: 'THE SCAPHOID PARADOX: Blood supply, Biomechanics and Why it fails', faculty: 'Dr Sahithya Bandi, Hyderabad' },
      { time: '09:05 - 09:15', type: 'Inappropriate', title: 'MISS IT, LOSE IT: Common Pitfalls in Scaphoid Injury Management', faculty: 'Dr Abhijeet Wahegaonkar, Pune' },
      { time: '09:15 - 09:25', type: 'Appropriate', title: 'TIMING IS EVERYTHING: Principle-based Management of Acute Scaphoid fractures', faculty: 'Dr Satya Vamshi Krishna, Bangalore' },
      { time: '09:25 - 09:35', type: 'Most Appropriate', title: 'SAVING THE SCAPHOID: Expert strategies for Non-unions and AVN', faculty: 'Dr Deepthi Nandan Reddy, Hyderabad' },
      { time: '09:35 - 09:45', type: 'Video', title: 'Percutaneous/Open Reduction and Herbert screw fixation of Acute Scaphoid fracture', faculty: 'Dr Terrence Jose Jerome, Trichy' },
      { time: '09:45 - 09:55', type: 'Video', title: 'Arthroscopy assisted Scaphoid Bone grafting and Fixation', faculty: 'Dr Amit Varade, Nashik' },
      { time: '09:55 - 10:00', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 10: Nerve in Focus — Palsy and Reconstruction', time: '10:00AM - 11:00AM', chairs: 'Dr. Sunil Gaba, Dr. Avinash G Rao', talks: [
      { time: '10:00 - 10:05', type: 'Anatomy', title: 'KNOW THE WIRES: Functional anatomy of peripheral nerves in upper limb', faculty: 'Dr Neeraj Godara, Delhi' },
      { time: '10:05 - 10:15', type: 'Inappropriate', title: 'DON\'T MESS THE WIRES: Common errors — Missed diagnosis, Wrong timings, Tensioned repairs', faculty: 'Dr Praveen Bhardwaj, Coimbatore' },
      { time: '10:15 - 10:25', type: 'Appropriate', title: 'WIRE THEM RIGHT: Evidence based management of Radial nerve Palsy', faculty: 'Prof M.V. Reddy, Hyderabad' },
      { time: '10:25 - 10:35', type: 'Most Appropriate', title: 'NEXT-LEVEL NERVE STRATEGY: Standard Principles of Nerve Repair and Reconstruction', faculty: 'Dr Vishal Mago, Rishikesh' },
      { time: '10:35 - 10:45', type: 'Video', title: 'Primary Epineural Repair and Nerve grafting', faculty: 'Dr Ravi Kiran Nalla, Hyderabad' },
      { time: '10:45 - 10:55', type: 'Video', title: 'Claw Correction and Opponensplasty — Tendon transfers', faculty: 'Dr G Karthikeyan, Chennai' },
      { time: '10:55 - 11:00', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 11: Distal Radius Fractures — Reduce, Restore, Respect', time: '11:30AM - 12:30PM', chairs: 'Dr. IV Reddy', talks: [
      { time: '11:30 - 11:35', type: 'Anatomy', title: 'THE WRIST FOUNDATION: Articular surface, Columnar concept and Load transmission', faculty: 'Dr Sujith Kumar Vakati, Hyderabad' },
      { time: '11:35 - 11:45', type: 'Inappropriate', title: 'ERRORS THAT COST THE WRIST: Mal-reduction and avoidable Wrist Dysfunction', faculty: 'Dr Ravi Bharadwaj, Kolkata' },
      { time: '11:45 - 11:55', type: 'Appropriate', title: 'RESPECT THE RADIUS: Principle-based Management of Distal radius fractures', faculty: 'Dr Srinivas Kasha, Hyderabad' },
      { time: '11:55 - 12:05', type: 'Most Appropriate', title: 'OPTIMISING FORM, FUNCTION AND MOTION: Arthroscopy assisted Distal Radius fixation', faculty: 'Dr Anirban Chatterjee, Kolkata' },
      { time: '12:05 - 12:15', type: 'Video', title: 'Volar and Dorsal plating of Distal radius', faculty: 'Dr Anup Bansode, Pune' },
      { time: '12:15 - 12:25', type: 'Video', title: 'Correction and Fixation of Malunited distal Radius fracture', faculty: 'Prof Anil K Bhat, Manipal' },
      { time: '12:25 - 12:30', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
    { module: 'Module 12: Tendon Injuries — From Rupture to Glide', time: '12:30PM - 01:30PM', chairs: 'Dr. Arya Roy, Dr. Bipin Ghanghurde', talks: [
      { time: '12:30 - 12:35', type: 'Anatomy', title: 'KNOW THE GLIDE: Zones, Pulleys, Vascularity and Tendon healing', faculty: 'Dr Madhu Vinay, Hyderabad' },
      { time: '12:35 - 12:45', type: 'Inappropriate', title: 'WHY REPAIR FAILS: Common errors in Tendon Repair', faculty: 'Dr G Karthikeyan, Chennai' },
      { time: '12:45 - 12:55', type: 'Appropriate', title: 'STRONG, SMOOTH, STABLE: Standard principles of Tendon Repair and Rehabilitation', faculty: 'Dr Gopinath Bandari, Hyderabad' },
      { time: '12:55 - 01:05', type: 'Most Appropriate', title: 'REPAIR THAT MOVES: Advanced strategies of Tendon Repair and Rehab: WALANT', faculty: 'Dr Ajeesh Sankaran, Calicut' },
      { time: '01:05 - 01:15', type: 'Video', title: 'Primary Flexor Tendon Repair Demonstration — Zone wise examples', faculty: 'Dr Suneel R, Hyderabad' },
      { time: '01:15 - 01:25', type: 'Video', title: 'Tendon reconstruction for chronic Delayed Ruptures / Extensor tendon repair', faculty: 'Dr Avinash G Rao, Hyderabad' },
      { time: '01:25 - 01:30', type: 'Q&A', title: 'Q&A', faculty: '' },
    ]},
  ] as Module[],
  day1HallB: [
    { module: 'Free Paper Presentations (FP-01)', time: '09:00AM - 10:00AM', chairs: 'Dr. Anjaneyulu, Dr. Srinivas Thati, Dr. Mani Kumari', talks: [] },
    { module: 'Free Paper Presentations (FP-02)', time: '10:00AM - 11:00AM', chairs: 'Dr. Deepthi Nandan Reddy, Dr. Vijay Chandra Reddy, Dr. Abhijeet Wahegaonkar', talks: [] },
    { module: 'Free Paper Presentations (FP-03)', time: '11:30AM - 12:30PM', chairs: 'Dr. Shailesh Gupta, Dr. P.L. Srinivas, Dr. Srinivas Reddy', talks: [] },
    { module: 'Free Paper Presentations (FP-04)', time: '12:30PM - 01:30PM', chairs: 'Dr. Raju Iyengar', talks: [] },
    { module: 'Meet the Mentors — Fellowship Guidance Program', time: '02:15PM - 03:15PM', chairs: 'Dr. Praveen Bhardwaj, Dr. Mani Kumari, Dr. Srinivasan Rajappa', talks: [
      { time: '02:15 - 02:25', type: 'Mentor', title: 'Hand Training Pathways in India', faculty: 'Prof Anil K Bhat, Manipal' },
      { time: '02:25 - 02:35', type: 'Mentor', title: 'Hand Fellowships: India VS Abroad', faculty: 'Dr Bipin Ghanghurde, Mumbai' },
    ]},
    { module: 'E-Poster Presentations', time: '03:15PM - 05:15PM', chairs: '', talks: [] },
  ] as Module[],
  day2HallB: [
    { module: 'Free Paper Presentations (FP-05)', time: '08:00AM - 09:00AM', chairs: '', talks: [] },
    { module: 'Precision Matters — Small Details, Big Outcomes', time: '09:00AM - 10:00AM', chairs: 'Dr. Sandeep Sriram', talks: [
      { time: '09:00 - 09:10', type: 'Talk', title: 'IRREDUCIBLE, UNMISSABLE: Kaplan\'s Dislocation', faculty: 'Dr Neeraj Godara, Delhi' },
      { time: '09:10 - 09:20', type: 'Talk', title: 'WHEN THUMB LOSES ITS GRIP: Ligamentous Injuries of Thumb', faculty: 'Dr Parag Lad, Mumbai' },
      { time: '09:20 - 09:30', type: 'Talk', title: 'SAVE THE SADDLE: 1st CMC Arthritis', faculty: 'Dr Shailesh Gupta, Indore' },
      { time: '09:30 - 09:40', type: 'Talk', title: 'RESPECT THE BASE: Thumb Base Fractures', faculty: 'Dr Mithun Pai, Mangalore' },
      { time: '09:40 - 09:50', type: 'Talk', title: 'WHEN KNUCKLE DROPS: Fixing metacarpal neck fractures', faculty: 'Dr Nikita Shetty, Mumbai' },
      { time: '09:50 - 10:00', type: 'Talk', title: 'Fingertip Amputation', faculty: 'Dr Akhilesh Agarwal' },
    ]},
    { module: 'Module 14: Additional Insights — Where Details Decide Outcomes', time: '10:00AM - 11:00AM', chairs: 'Dr. Avinash G Rao, Dr. Sunil Gaba, Dr. Bipin Ghanghurde', talks: [
      { time: '10:00 - 10:10', type: 'Talk', title: 'VOLKMANNS 2.0: What\'s new in VIC?', faculty: 'Dr Terrence Jose Jerome, Trichy' },
      { time: '10:10 - 10:20', type: 'Talk', title: 'WHEN HEALING HURTS: Management of CRPS', faculty: 'Dr Bipin Ghanghurde, Mumbai' },
      { time: '10:20 - 10:30', type: 'Talk', title: 'ULNAR SIDED UNTOLD STORY: TFCC Injuries', faculty: 'Dr Abhijeet Wahegaonkar, Pune' },
      { time: '10:30 - 10:40', type: 'Talk', title: 'IGNORED TODAY, UNSTABLE TOMORROW: Neglected DRUJ Instabilities', faculty: 'Dr Gopinath Bandari, Hyderabad' },
      { time: '10:40 - 10:50', type: 'Talk', title: 'BREAK THE TONE: Reconstructing Spastic Hand for Function & Freedom', faculty: 'Dr Pawan Sadhvani' },
      { time: '10:50 - 11:00', type: 'Talk', title: 'THE HIDDEN COMPRESSION: Thoracic Outlet Syndrome', faculty: 'Dr Nishant Sadhanala' },
    ]},
    { module: 'Module 15: Every Day Surgeries Done Right — Relive Videos', time: '11:30AM - 12:30PM', chairs: 'Dr. Manesh Jain', talks: [
      { time: '11:30 - 11:40', type: 'Video', title: 'RELEASE WITH PRECISION: De Quervain\'s release done right', faculty: 'Dr Bindesh Dadi, Guntur' },
      { time: '11:40 - 11:50', type: 'Video', title: 'EXCISION WITHOUT RECURRENCE: Smart Ganglion Surgery', faculty: 'Dr Pankaj Kabra, Hyderabad' },
      { time: '11:50 - 12:00', type: 'Video', title: 'UNLOCKING THE FINGER: Safe and effective Trigger release', faculty: 'Dr Sahithya Bandi, Hyderabad' },
      { time: '12:00 - 12:10', type: 'Video', title: 'LENGTHEN, REALIGN AND RESTORE: Scar release and Z-Plasty', faculty: 'Dr Bharatendu Swain, Hyderabad' },
      { time: '12:10 - 12:20', type: 'Video', title: 'COVER WITH CONFIDENCE: Choosing split and full thickness grafts', faculty: 'Dr Rohit Babu, Hyderabad' },
    ]},
  ] as Module[],
}

// Session type colors — colored left border style matching TNSCON
const getSessionTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'Anatomy': 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
    'Inappropriate': 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
    'Appropriate': 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
    'Most Appropriate': 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20',
    'Video': 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
    'Q&A': 'border-l-gray-400 bg-gray-50 dark:bg-gray-800',
    'Pioneer': 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20',
    'Special': 'border-l-pink-500 bg-pink-50 dark:bg-pink-900/20',
    'Award': 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    'Talk': 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    'Mentor': 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  }
  return colors[type] || 'border-l-slate-400 bg-slate-50 dark:bg-slate-800'
}

const getTypeBadgeColor = (type: string) => {
  const colors: Record<string, string> = {
    'Anatomy': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    'Inappropriate': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    'Appropriate': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    'Most Appropriate': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    'Video': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    'Q&A': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'Pioneer': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    'Special': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
    'Award': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    'Talk': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
    'Mentor': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

const typeIcons: Record<string, any> = {
  'Anatomy': BookOpen,
  'Inappropriate': HelpCircle,
  'Appropriate': Star,
  'Most Appropriate': Award,
  'Video': Video,
  'Q&A': HelpCircle,
  'Pioneer': Star,
  'Special': Mic,
  'Award': Award,
  'Talk': Mic,
  'Mentor': Users,
}

export default function ProgramSchedulePage() {
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1)
  const [selectedHall, setSelectedHall] = useState<'A' | 'B'>('A')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'detailed' | 'overview'>('detailed')

  const currentModules = useMemo(() => {
    const key = `day${selectedDay}Hall${selectedHall}` as keyof typeof programmeData
    return (programmeData[key] || []) as Module[]
  }, [selectedDay, selectedHall])

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim() && filterType === 'all') return currentModules
    const q = searchQuery.toLowerCase()
    return currentModules.map(mod => {
      const moduleMatch = mod.module.toLowerCase().includes(q) || mod.chairs?.toLowerCase().includes(q)
      const filteredTalks = mod.talks.filter(t => {
        const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.faculty?.toLowerCase().includes(q) || t.type.toLowerCase().includes(q)
        const matchesType = filterType === 'all' || t.type === filterType
        return matchesSearch && matchesType
      })
      if (moduleMatch && filterType === 'all') return mod
      if (filteredTalks.length > 0) return { ...mod, talks: filteredTalks }
      return null
    }).filter(Boolean) as Module[]
  }, [currentModules, searchQuery, filterType])

  const overviewData = selectedDay === 1 ? programmeData.overview.day1 : programmeData.overview.day2

  const allTypes = useMemo(() => {
    const types = new Set<string>()
    currentModules.forEach(mod => mod.talks.forEach(t => types.add(t.type)))
    return Array.from(types)
  }, [currentModules])

  const handleExportDay = () => {
    const date = selectedDay === 1 ? '2026-04-25' : '2026-04-26'
    const icsContent = generateICS(`Day ${selectedDay}`, date, currentModules)
    downloadICS(icsContent, `ISSH-2026-Day${selectedDay}-Hall${selectedHall}.ics`)
    toast.success('Calendar file downloaded!')
  }

  const handleDownloadPDF = () => {
    window.open('/ISSH SCIENTIFIC PROGRAMME.pdf', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-r from-[#25406b] to-[#152843] overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Calendar className="w-16 h-16 mx-auto mb-6 text-white/80" />
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Scientific Programme
              </h1>
              <p className="text-xl md:text-2xl text-blue-200 mb-2">
                {conferenceConfig.shortName} — April 25-26, 2026
              </p>
              <p className="text-blue-300">HICC Novotel, Hyderabad</p>
              <div className="mt-6">
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Programme PDF
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Day Selector — Sticky */}
      <section className="py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <Button
              onClick={() => setSelectedDay(1)}
              variant={selectedDay === 1 ? "default" : "outline"}
              className={selectedDay === 1 ? 'bg-[#25406b] text-white hover:bg-[#1d3357]' : 'border-2 hover:border-[#25406b]'}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-bold">Day 1</div>
                <div className="text-xs opacity-90">Apr 25, Sat</div>
              </div>
            </Button>
            <Button
              onClick={() => setSelectedDay(2)}
              variant={selectedDay === 2 ? "default" : "outline"}
              className={selectedDay === 2 ? 'bg-[#25406b] text-white hover:bg-[#1d3357]' : 'border-2 hover:border-[#25406b]'}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-bold">Day 2</div>
                <div className="text-xs opacity-90">Apr 26, Sun</div>
              </div>
            </Button>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block" />
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('overview')}
              className={viewMode === 'overview' ? 'bg-[#25406b]' : ''}
            >
              Overview
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('detailed')}
              className={viewMode === 'detailed' ? 'bg-[#25406b]' : ''}
            >
              Detailed
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <AnimatePresence mode="wait">
            {viewMode === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Overview Card */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Day {selectedDay} — At a Glance</CardTitle>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {selectedDay === 1 ? 'Saturday, April 25, 2026' : 'Sunday, April 26, 2026'}
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#25406b] text-white">
                          <th className="p-3 text-left w-[180px]">Time</th>
                          <th className="p-3 text-left">Hall A</th>
                          <th className="p-3 text-left">Hall B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.map((row, i) => {
                          const isBreak = row.hallA.toLowerCase().includes('break') || row.hallA.toLowerCase().includes('lunch') || row.hallA.toLowerCase().includes('banquet') || row.hallA.toLowerCase().includes('inauguration') || row.hallA.toLowerCase().includes('valedictory')
                          return (
                            <tr key={i} className={`border-b ${isBreak ? 'bg-amber-50 dark:bg-amber-900/10' : i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
                              <td className="p-3 font-mono text-xs font-bold text-[#25406b] dark:text-blue-300 whitespace-nowrap">
                                <Clock className="w-3 h-3 inline mr-1" />{row.time}
                              </td>
                              <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                                {isBreak ? <span className="flex items-center gap-1"><Coffee className="w-3 h-3 text-amber-600" />{row.hallA}</span> : row.hallA}
                              </td>
                              <td className="p-3 text-gray-600 dark:text-gray-400">{row.hallB || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="detailed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >

                {/* Day Info Card */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <CardTitle className="text-2xl">Day {selectedDay} — Detailed Schedule</CardTitle>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {selectedDay === 1 ? 'Saturday, April 25, 2026' : 'Sunday, April 26, 2026'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExportDay}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Export Day
                        </Button>
                        <Button variant="outline" onClick={handleDownloadPDF}>
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Search & Filter Bar */}
                <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-2">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Hall Selector */}
                      <div className="flex gap-2">
                        <Button
                          variant={selectedHall === 'A' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedHall('A')}
                          className={selectedHall === 'A' ? 'bg-[#25406b]' : ''}
                        >
                          <MapPin className="w-3 h-3 mr-1" /> Hall A
                        </Button>
                        <Button
                          variant={selectedHall === 'B' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedHall('B')}
                          className={selectedHall === 'B' ? 'bg-[#25406b]' : ''}
                        >
                          <MapPin className="w-3 h-3 mr-1" /> Hall B
                        </Button>
                      </div>

                      {/* Search */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search sessions, speakers, topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-11 bg-white dark:bg-slate-950 border-2"
                        />
                      </div>

                      {/* Filter by Type */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={filterType === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType("all")}
                          className={filterType === "all" ? "bg-[#25406b]" : ""}
                        >
                          All
                        </Button>
                        {allTypes.slice(0, 5).map(type => (
                          <Button
                            key={type}
                            variant={filterType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(filterType === type ? 'all' : type)}
                            className={filterType === type ? "bg-[#25406b]" : ""}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Results count */}
                    {(searchQuery || filterType !== "all") && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredModules.reduce((acc, m) => acc + m.talks.length, 0)} sessions in {filteredModules.length} modules
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sessions — Flat list with colored left borders */}
                <div className="space-y-6">
                  {filteredModules.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">No sessions found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter</p>
                    </Card>
                  ) : (
                    filteredModules.map((mod, mi) => (
                      <motion.div
                        key={mi}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mi * 0.05 }}
                      >
                        {/* Module Header */}
                        <div className="mb-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{mod.module}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />{mod.time}
                            </span>
                            {mod.chairs && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />Chairs: {mod.chairs}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Session Cards */}
                        {mod.talks.length > 0 ? (
                          <div className="space-y-3">
                            {mod.talks.map((talk, ti) => {
                              const TypeIcon = typeIcons[talk.type] || Mic
                              return (
                                <Card
                                  key={ti}
                                  className={`hover:shadow-lg transition-all duration-300 overflow-hidden ${
                                    talk.type === 'Q&A' ? 'opacity-75' : ''
                                  }`}
                                >
                                  <CardContent className="p-0">
                                    <div className={`border-l-4 ${getSessionTypeColor(talk.type)} p-4 pl-5`}>
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1">
                                          {/* Time & Badge */}
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                              <Clock className="w-3.5 h-3.5 mr-1.5" />
                                              {talk.time}
                                            </div>
                                            <Badge className={`text-xs ${getTypeBadgeColor(talk.type)}`}>
                                              {talk.type}
                                            </Badge>
                                          </div>

                                          {/* Title */}
                                          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                                            {talk.title}
                                          </h4>

                                          {/* Faculty with avatar */}
                                          {talk.faculty && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                              </div>
                                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {talk.faculty}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        ) : (
                          <Card className="opacity-75">
                            <CardContent className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                              Detailed schedule available at the venue
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Legend */}
                <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Session Types</p>
                  <div className="flex flex-wrap gap-2">
                    {['Anatomy', 'Inappropriate', 'Appropriate', 'Most Appropriate', 'Video', 'Q&A', 'Pioneer', 'Special', 'Award', 'Talk', 'Mentor'].map(type => (
                      <Badge key={type} className={`text-xs ${getTypeBadgeColor(type)}`}>
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Venue Info */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <MapPin className="w-8 h-8 text-[#25406b] mb-3" />
                <h3 className="font-bold text-lg mb-1">Hall A — Main Auditorium</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scientific Modules & Keynote Sessions</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <MapPin className="w-8 h-8 text-[#25406b] mb-3" />
                <h3 className="font-bold text-lg mb-1">Hall B — Conference Hall</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Free Papers, Posters & Workshops</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
