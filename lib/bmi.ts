/** BMI = kg / m² */
export function computeBmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function weightForBmi(bmi: number, heightCm: number): number | null {
  if (!(bmi > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return bmi * m * m;
}

export function formatBmi(bmi: number | null, digits = 1): string {
  if (bmi == null || Number.isNaN(bmi)) return "—";
  return bmi.toFixed(digits);
}

export function bmiCategory(bmi: number | null): string {
  if (bmi == null || Number.isNaN(bmi)) return "Unknown";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/** WHO / many national services: ~3 months between whole-blood donations */
export const DEFAULT_BLOOD_WAIT_DAYS = 90;

export function bloodEligibility(
  donatedAt: string | null,
  waitDays = DEFAULT_BLOOD_WAIT_DAYS,
  today = new Date(),
): {
  eligible: boolean;
  nextDate: string | null;
  daysRemaining: number | null;
} {
  if (!donatedAt) {
    return { eligible: true, nextDate: null, daysRemaining: 0 };
  }
  const donated = new Date(`${donatedAt}T00:00:00`);
  if (Number.isNaN(donated.getTime())) {
    return { eligible: true, nextDate: null, daysRemaining: 0 };
  }
  const next = new Date(donated);
  next.setDate(next.getDate() + waitDays);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  const diffMs = next.getTime() - todayStart.getTime();
  const daysRemaining = Math.ceil(diffMs / 86400000);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  const nextDate = `${y}-${m}-${d}`;
  if (daysRemaining <= 0) {
    return { eligible: true, nextDate, daysRemaining: 0 };
  }
  return { eligible: false, nextDate, daysRemaining };
}
