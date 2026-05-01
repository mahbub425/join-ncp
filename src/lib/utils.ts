export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function bnToEnDigits(str: string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (d) => bnDigits.indexOf(d).toString());
}
