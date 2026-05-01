import { z } from 'zod';

export const submissionSchema = z.object({
  personal: z.object({
    name: z.string().min(2, { message: "নাম কমপক্ষে ২ অক্ষরের হতে হবে" }),
    nid: z.string().regex(/^[0-9০-৯]{10,17}$/, { message: "সঠিক এনআইডি নম্বর দিন (১০-১৭ ডিজিট)" }),
    fatherName: z.string().min(2, { message: "পিতার নাম আবশ্যক" }),
    motherName: z.string().min(2, { message: "মাতার নাম আবশ্যক" }),
    dob: z.string().min(1, { message: "জন্ম তারিখ আবশ্যক" }),
    bloodGroup: z.string().min(1, { message: "রক্তের গ্রুপ লিখুন" }),
    gender: z.string().min(1, { message: "লিঙ্গ নির্বাচন করুন" }),
    photoUrl: z.string().optional(),
  }),
  education: z.object({
    qualification: z.string().optional(),
    institute: z.string().optional(),
  }),
  presentAddress: z.object({
    village: z.string().min(1, { message: "গ্রাম/রাস্তা আবশ্যক" }),
    union: z.string().min(1, { message: "ইউনিয়ন/ওয়ার্ড আবশ্যক" }),
    post: z.string().min(1, { message: "ডাকঘর আবশ্যক" }),
    thana: z.string().min(1, { message: "থানা আবশ্যক" }),
    upazila: z.string().min(1, { message: "উপজেলা আবশ্যক" }),
    district: z.string().min(1, { message: "জেলা আবশ্যক" }),
  }),
  permanentAddress: z.object({
    village: z.string().min(1, { message: "গ্রাম/রাস্তা আবশ্যক" }),
    union: z.string().min(1, { message: "ইউনিয়ন/ওয়ার্ড আবশ্যক" }),
    post: z.string().min(1, { message: "ডাকঘর আবশ্যক" }),
    thana: z.string().min(1, { message: "থানা আবশ্যক" }),
    upazila: z.string().min(1, { message: "উপজেলা আবশ্যক" }),
    district: z.string().min(1, { message: "জেলা আবশ্যক" }),
  }),
  profession: z.object({
    occupation: z.string().optional(),
    workplace: z.string().optional(),
  }),
  contact: z.object({
    mobile: z.string().regex(/^(01|০১)[3-9৩-৯][0-9০-৯]{8}$/, { message: "সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)" }),
    email: z.string().email({ message: "সঠিক ইমেইল দিন" }).optional().or(z.literal('')),
    facebook: z.string().optional(),
  }),
  experience: z.object({
    politicalAffiliation: z.boolean(),
    politicalOrgName: z.string().optional(),
    orgExperience: z.boolean(),
    socialOrgName: z.string().optional(),
  }),
  intent: z.object({
    workArea: z.string().optional(),
    contribution: z.string().optional(),
  }),
  applicantSignature: z.string().min(1, { message: "স্বাক্ষর লিখুন" }),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;
