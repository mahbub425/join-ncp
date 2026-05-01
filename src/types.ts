export enum SubmissionStatus {
  New = 'New',
  Reviewed = 'Reviewed',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface PersonalInfo {
  name: string;
  nid: string;
  fatherName: string;
  motherName: string;
  dob: string;
  bloodGroup: string;
  gender: string;
  photoUrl?: string;
}

export interface AddressInfo {
  village: string;
  union: string;
  post: string;
  thana: string;
  upazila: string;
  district: string;
}

export interface Submission {
  id: string;
  formNo: string;
  personal: PersonalInfo;
  education: {
    qualification: string;
    institute: string;
  };
  presentAddress: AddressInfo;
  permanentAddress: AddressInfo;
  profession: {
    occupation: string;
    workplace: string;
  };
  contact: {
    mobile: string;
    email?: string;
    facebook?: string;
  };
  experience: {
    politicalAffiliation: boolean;
    orgExperience: boolean;
  };
  intent: {
    workArea: string;
    contribution: string;
  };
  applicantSignature?: string;
  authoritySignature?: string;
  signatureUrl?: string;
  status: SubmissionStatus;
  submittedAt: any; // Firestore Timestamp
}

export interface PageSettings {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactPhone: string;
  contactAddress: string;
  contactEmail: string;
  facebookPage: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox' | 'textarea' | 'file';
  section: string;
  required: boolean;
  order: number;
  options?: string[];
  isHidden: boolean;
}
