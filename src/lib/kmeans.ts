import model from "./collegeModel.json";

export interface College {
  College_Name: string;
  Student_Faculty_Ratio: number;
  Annual_Fees_INR: number;
  Placement_Percentage: number;
  Average_Package_LPA: number;
  Infrastructure_Score: number;
  college_level: number;
  Category: string;
}

export interface ModelData {
  features: string[];
  scalerMean: number[];
  scalerScale: number[];
  centers: number[][];
  clusterNames: Record<string, string>;
  colleges: College[];
}

export const collegeModel = model as ModelData;

export const CLUSTER_COLORS: Record<string, string> = {
  "Best Colleges": "var(--cluster-best)",
  "Mid-Level Colleges": "var(--cluster-mid)",
  "Emerging / Lower-Level Colleges": "var(--cluster-emerging)",
};

export interface CollegeInput {
  studentFacultyRatio: number;
  annualFees: number;
  placementPercentage: number;
  averagePackage: number;
  infrastructureScore: number;
}

export interface Prediction {
  clusterId: number;
  category: string;
  distance: number;
  distances: number[];
}

/** Replicates sklearn: scale with StandardScaler, then nearest centroid (KMeans.predict). */
export function predictCluster(input: CollegeInput): Prediction {
  const raw = [
    input.studentFacultyRatio,
    input.annualFees,
    input.placementPercentage,
    input.averagePackage,
    input.infrastructureScore,
  ];
  const scaled = raw.map(
    (v, i) => (v - collegeModel.scalerMean[i]!) / collegeModel.scalerScale[i]!
  );
  const distances = collegeModel.centers.map((center) =>
    Math.sqrt(center.reduce((sum, c, i) => sum + (c - scaled[i]!) ** 2, 0))
  );
  const clusterId = distances.indexOf(Math.min(...distances));
  return {
    clusterId,
    category: collegeModel.clusterNames[String(clusterId)]!,
    distance: distances[clusterId]!,
    distances,
  };
}

export function clusterStats() {
  const names = Object.values(collegeModel.clusterNames);
  return names.map((name) => {
    const members = collegeModel.colleges.filter((c) => c.Category === name);
    const avg = (key: keyof College) =>
      members.reduce((s, c) => s + (c[key] as number), 0) / members.length;
    return {
      name,
      count: members.length,
      avgPlacement: avg("Placement_Percentage"),
      avgPackage: avg("Average_Package_LPA"),
      avgFees: avg("Annual_Fees_INR"),
      avgInfra: avg("Infrastructure_Score"),
      avgRatio: avg("Student_Faculty_Ratio"),
    };
  });
}

export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
