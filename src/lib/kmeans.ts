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

export interface NearestCollege {
  name: string;
  category: string;
  distance: number;
  placementPercentage: number;
  averagePackage: number;
  annualFees: number;
}

export interface Prediction {
  clusterId: number;
  category: string;
  distance: number;
  distances: number[];
  nearestColleges: NearestCollege[];
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

  const nearestColleges = collegeModel.colleges
    .map((c) => {
      const cr = [
        c.Student_Faculty_Ratio,
        c.Annual_Fees_INR,
        c.Placement_Percentage,
        c.Average_Package_LPA,
        c.Infrastructure_Score,
      ];
      const cs = cr.map(
        (v, i) => (v - collegeModel.scalerMean[i]!) / collegeModel.scalerScale[i]!
      );
      const d = Math.sqrt(cs.reduce((sum, v, i) => sum + (v - scaled[i]!) ** 2, 0));
      return {
        name: c.College_Name,
        category: c.Category,
        distance: d,
        placementPercentage: c.Placement_Percentage,
        averagePackage: c.Average_Package_LPA,
        annualFees: c.Annual_Fees_INR,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  return {
    clusterId,
    category: collegeModel.clusterNames[String(clusterId)]!,
    distance: distances[clusterId]!,
    distances,
    nearestColleges,
  };
}

/** A few real example colleges per cluster, shown on the cluster cards. */
export function sampleCollegesPerCluster(perCluster = 3) {
  const names = Object.values(collegeModel.clusterNames);
  return names.map((name) => ({
    name,
    samples: collegeModel.colleges
      .filter((c) => c.Category === name)
      .slice(0, perCluster)
      .map((c) => c.College_Name),
  }));
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
