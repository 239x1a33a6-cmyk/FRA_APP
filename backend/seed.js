const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Manually parse .env to bypass dotenvx issues with & in connection strings
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach(line => {
  const eq = line.indexOf("=");
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
});

const User = require("./models/User");
const AdministrativeUnit = require("./models/AdministrativeUnit");
const Authority = require("./models/Authority");
const Beneficiary = require("./models/Beneficiary");
const Claim = require("./models/Claim");
const ClaimVerification = require("./models/ClaimVerification");
const ClaimDecision = require("./models/ClaimDecision");
const ClaimHistory = require("./models/ClaimHistory");
const AuditLog = require("./models/AuditLog");

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
        User.deleteMany(), AdministrativeUnit.deleteMany(),
        Authority.deleteMany(), Beneficiary.deleteMany(),
        Claim.deleteMany(), ClaimVerification.deleteMany(),
        ClaimDecision.deleteMany(), ClaimHistory.deleteMany(),
        AuditLog.deleteMany()
    ]);
    console.log("Cleared existing data");

    // ── Administrative Hierarchy ──────────────────────────────────────────────
    const state = await AdministrativeUnit.create({ name: "Telangana", type: "STATE", code: "TS" });
    const dist = await AdministrativeUnit.create({ name: "Adilabad", type: "DISTRICT", code: "ADB", parentId: state._id });
    const subDiv = await AdministrativeUnit.create({ name: "Adilabad Sub-Division", type: "SUB_DIVISION", code: "ADB-SD", parentId: dist._id });
    const mandal = await AdministrativeUnit.create({ name: "Utnoor Mandal", type: "MANDAL", code: "UTN", parentId: subDiv._id });
    const gp = await AdministrativeUnit.create({ name: "Kerameri GP", type: "GRAM_PANCHAYAT", code: "KRM-GP", parentId: mandal._id });
    const village = await AdministrativeUnit.create({ name: "Kerameri Village", type: "VILLAGE", code: "KRM-V", parentId: gp._id });
    const village2 = await AdministrativeUnit.create({ name: "Penchikalpet Village", type: "VILLAGE", code: "PNK-V", parentId: gp._id });
    console.log("Administrative units created");

    // ── Authorities ───────────────────────────────────────────────────────────
    const frc = await Authority.create({ name: "FRC - Kerameri", type: "FRC", administrativeUnitId: village._id, description: "Forest Rights Committee for Kerameri Village" });
    const gramSabha = await Authority.create({ name: "Gram Sabha - Kerameri", type: "GRAM_SABHA", administrativeUnitId: gp._id, description: "Gram Sabha for Kerameri GP" });
    const sdlc = await Authority.create({ name: "SDLC - Adilabad", type: "SDLC", administrativeUnitId: subDiv._id, description: "Sub-Divisional Level Committee" });
    const dlc = await Authority.create({ name: "DLC - Adilabad", type: "DLC", administrativeUnitId: dist._id, description: "District Level Committee" });
    console.log("Authorities created");

    // ── Users ─────────────────────────────────────────────────────────────────
    const hashed = await bcrypt.hash("password123", 12);

    const admin = await User.create({ name: "Admin User", email: "admin@fra.gov.in", password: hashed, role: "ADMIN", isApproved: true });
    const frcOfficer = await User.create({ name: "Ramesh Kumar (FRC)", email: "frc@fra.gov.in", password: hashed, role: "OFFICER", authorityId: frc._id, isApproved: true });
    const gramOfficer = await User.create({ name: "Sita Devi (GS)", email: "gramsabha@fra.gov.in", password: hashed, role: "OFFICER", authorityId: gramSabha._id, isApproved: true });
    const sdlcOfficer = await User.create({ name: "Ravi Shankar (SDLC)", email: "sdlc@fra.gov.in", password: hashed, role: "OFFICER", authorityId: sdlc._id, isApproved: true });
    const dlcOfficer = await User.create({ name: "Dr. Prasad (DLC)", email: "dlc@fra.gov.in", password: hashed, role: "OFFICER", authorityId: dlc._id, isApproved: true });
    const viewer = await User.create({ name: "Field Viewer", email: "viewer@fra.gov.in", password: hashed, role: "VIEWER", isApproved: true });
    console.log("Users created");

    // ── Beneficiaries ─────────────────────────────────────────────────────────
    const bene1 = await Beneficiary.create({ name: "Ravi Kumar", fatherOrMotherName: "Somaiah", gender: "Male", dateOfBirth: new Date("1975-06-15"), category: "ST", contactNumber: "9876543210", address: "H.No 12, Kerameri Village", administrativeUnitId: village._id, createdBy: admin._id });
    const bene2 = await Beneficiary.create({ name: "Lakshmi Bai", fatherOrMotherName: "Narsaiah", gender: "Female", dateOfBirth: new Date("1980-03-22"), category: "ST", contactNumber: "9876543211", address: "H.No 5, Kerameri Village", administrativeUnitId: village._id, createdBy: admin._id });
    const bene3 = await Beneficiary.create({ name: "Pochaiah Rathod", fatherOrMotherName: "Bhavaiah", gender: "Male", dateOfBirth: new Date("1968-11-10"), category: "ST", contactNumber: "9876543212", address: "H.No 28, Penchikalpet Village", administrativeUnitId: village2._id, createdBy: admin._id });
    const bene4 = await Beneficiary.create({ name: "Sonu Madavi", fatherOrMotherName: "Jangu", gender: "Male", dateOfBirth: new Date("1972-08-05"), category: "ST", contactNumber: "9876543213", address: "H.No 3, Kerameri Village", administrativeUnitId: village._id, createdBy: admin._id });
    const bene5 = await Beneficiary.create({ name: "Kamla Atram", fatherOrMotherName: "Bhima", gender: "Female", dateOfBirth: new Date("1985-01-18"), category: "ST", contactNumber: "9876543214", address: "H.No 17, Penchikalpet Village", administrativeUnitId: village2._id, createdBy: admin._id });
    console.log("Beneficiaries created");

    // ── Helper to create claim + initial history ──────────────────────────────
    const makeClaim = async ({ claimType, beneficiary, unit, claimDetails, stage, status, submittedBy }) => {
        const claim = await Claim.create({
            claimType, beneficiaryId: beneficiary._id, administrativeUnitId: unit._id,
            submittedBy: submittedBy._id, currentStage: stage, overallStatus: status,
            claimDetails, evidenceSummary: "Supporting documents submitted at village level"
        });
        await ClaimHistory.create({ claimId: claim._id, fromStage: "CREATED", toStage: "GRAM_SABHA", action: "CLAIM_SUBMITTED", performedBy: submittedBy._id, remarks: "Claim submitted" });
        return claim;
    };

    // ── Claim 1 — IFR — Fully APPROVED ───────────────────────────────────────
    const c1 = await makeClaim({ claimType: "IFR", beneficiary: bene1, unit: village, claimDetails: { landArea: 3.2, landPurpose: "Agriculture", disputedLand: false, rehabilitationDetails: "No rehabilitation required" }, stage: "COMPLETED", status: "APPROVED", submittedBy: admin });

    // FRC Verification
    const v1 = await ClaimVerification.create({ claimId: c1._id, authorityId: frc._id, verifiedBy: frcOfficer._id, siteVisited: true, landVerified: true, claimedArea: 3.2, verifiedArea: 3.0, findings: "Land is occupied and cultivated by the claimant for over 25 years. Boundary markers present.", verificationStatus: "COMPLETED", remarks: "Verified successfully" });
    await ClaimHistory.create({ claimId: c1._id, fromStage: "FRC_VERIFICATION", toStage: "GRAM_SABHA_DECISION", action: "FRC_VERIFICATION_COMPLETED", performedBy: frcOfficer._id, authorityId: frc._id });

    // Gram Sabha Decision
    await ClaimDecision.create({ claimId: c1._id, authorityId: gramSabha._id, decisionLevel: "GRAM_SABHA", decision: "RECOMMENDED", decidedBy: gramOfficer._id, resolutionNumber: "GS/KRM/2024/001", remarks: "Recommended unanimously" });
    await ClaimHistory.create({ claimId: c1._id, fromStage: "GRAM_SABHA_DECISION", toStage: "SDLC_REVIEW", action: "GRAM_SABHA_DECISION_RECOMMENDED", performedBy: gramOfficer._id, authorityId: gramSabha._id });

    // SDLC Decision
    await ClaimDecision.create({ claimId: c1._id, authorityId: sdlc._id, decisionLevel: "SDLC", decision: "RECOMMENDED", decidedBy: sdlcOfficer._id, remarks: "SDLC recommends approval" });
    await ClaimHistory.create({ claimId: c1._id, fromStage: "SDLC_REVIEW", toStage: "DLC_REVIEW", action: "SDLC_DECISION_RECOMMENDED", performedBy: sdlcOfficer._id, authorityId: sdlc._id });

    // DLC Decision
    await ClaimDecision.create({ claimId: c1._id, authorityId: dlc._id, decisionLevel: "DLC", decision: "APPROVED", decidedBy: dlcOfficer._id, remarks: "DLC approves IFR claim" });
    await ClaimHistory.create({ claimId: c1._id, fromStage: "DLC_REVIEW", toStage: "COMPLETED", action: "DLC_DECISION_APPROVED", performedBy: dlcOfficer._id, authorityId: dlc._id });

    // ── Claim 2 — CR — At SDLC stage ─────────────────────────────────────────
    const c2 = await makeClaim({ claimType: "CR", beneficiary: bene2, unit: village, claimDetails: { nistar: "Grazing and minor forest produce", minorForestProduce: "Tendu leaves, mahua", waterBodies: "Village pond", grazing: "250 acres common land" }, stage: "SDLC_REVIEW", status: "IN_PROCESS", submittedBy: frcOfficer });
    await ClaimVerification.create({ claimId: c2._id, authorityId: frc._id, verifiedBy: frcOfficer._id, siteVisited: true, landVerified: true, claimedArea: 250, verifiedArea: 230, findings: "Community traditionally uses the area for grazing and NTFP collection.", verificationStatus: "COMPLETED" });
    await ClaimHistory.create({ claimId: c2._id, fromStage: "FRC_VERIFICATION", toStage: "GRAM_SABHA_DECISION", action: "FRC_VERIFICATION_COMPLETED", performedBy: frcOfficer._id, authorityId: frc._id });
    await ClaimDecision.create({ claimId: c2._id, authorityId: gramSabha._id, decisionLevel: "GRAM_SABHA", decision: "RECOMMENDED", decidedBy: gramOfficer._id, resolutionNumber: "GS/KRM/2024/002" });
    await ClaimHistory.create({ claimId: c2._id, fromStage: "GRAM_SABHA_DECISION", toStage: "SDLC_REVIEW", action: "GRAM_SABHA_DECISION_RECOMMENDED", performedBy: gramOfficer._id, authorityId: gramSabha._id });

    // ── Claim 3 — CFR — At FRC Verification ──────────────────────────────────
    const c3 = await makeClaim({ claimType: "CFR", beneficiary: bene3, unit: village2, claimDetails: { forestResourceDetails: "Dense teak and bamboo forest", communityForestArea: 1200, biodiversityDetails: "Rich medicinal plant diversity", traditionalKnowledge: "Community managed for generations" }, stage: "FRC_VERIFICATION", status: "IN_PROCESS", submittedBy: admin });
    await ClaimHistory.create({ claimId: c3._id, fromStage: "GRAM_SABHA", toStage: "FRC_VERIFICATION", action: "FORWARDED_TO_FRC", performedBy: gramOfficer._id, authorityId: gramSabha._id });

    // ── Claim 4 — IFR — At Gram Sabha (freshly submitted) ────────────────────
    await makeClaim({ claimType: "IFR", beneficiary: bene4, unit: village, claimDetails: { landArea: 1.5, landPurpose: "Agriculture - paddy", disputedLand: false }, stage: "GRAM_SABHA", status: "SUBMITTED", submittedBy: frcOfficer });

    // ── Claim 5 — IFR — REJECTED ──────────────────────────────────────────────
    const c5 = await makeClaim({ claimType: "IFR", beneficiary: bene5, unit: village2, claimDetails: { landArea: 5.0, landPurpose: "Agriculture", disputedLand: true }, stage: "COMPLETED", status: "REJECTED", submittedBy: admin });
    await ClaimVerification.create({ claimId: c5._id, authorityId: frc._id, verifiedBy: frcOfficer._id, siteVisited: true, landVerified: false, claimedArea: 5.0, verifiedArea: 0, findings: "Land is a reserved forest area, claim not maintainable.", verificationStatus: "COMPLETED" });
    await ClaimHistory.create({ claimId: c5._id, fromStage: "FRC_VERIFICATION", toStage: "GRAM_SABHA_DECISION", action: "FRC_VERIFICATION_COMPLETED", performedBy: frcOfficer._id, authorityId: frc._id });
    await ClaimDecision.create({ claimId: c5._id, authorityId: gramSabha._id, decisionLevel: "GRAM_SABHA", decision: "NOT_RECOMMENDED", decidedBy: gramOfficer._id, resolutionNumber: "GS/PNK/2024/001", remarks: "FRC found the land is reserved forest" });
    await ClaimHistory.create({ claimId: c5._id, fromStage: "GRAM_SABHA_DECISION", toStage: "SDLC_REVIEW", action: "GRAM_SABHA_DECISION_NOT_RECOMMENDED", performedBy: gramOfficer._id });
    await ClaimDecision.create({ claimId: c5._id, authorityId: sdlc._id, decisionLevel: "SDLC", decision: "NOT_RECOMMENDED", decidedBy: sdlcOfficer._id });
    await ClaimHistory.create({ claimId: c5._id, fromStage: "SDLC_REVIEW", toStage: "DLC_REVIEW", action: "SDLC_DECISION_NOT_RECOMMENDED", performedBy: sdlcOfficer._id });
    await ClaimDecision.create({ claimId: c5._id, authorityId: dlc._id, decisionLevel: "DLC", decision: "REJECTED", decidedBy: dlcOfficer._id, remarks: "Claim rejected - reserved forest area" });
    await ClaimHistory.create({ claimId: c5._id, fromStage: "DLC_REVIEW", toStage: "COMPLETED", action: "DLC_DECISION_REJECTED", performedBy: dlcOfficer._id });

    // ── Claim 6 — CR — At Gram Sabha Decision ────────────────────────────────
    const c6 = await makeClaim({ claimType: "CR", beneficiary: bene1, unit: village, claimDetails: { nistar: "Firewood collection", waterBodies: "Stream access", grazing: "Common pasture land" }, stage: "GRAM_SABHA_DECISION", status: "IN_PROCESS", submittedBy: frcOfficer });
    await ClaimVerification.create({ claimId: c6._id, authorityId: frc._id, verifiedBy: frcOfficer._id, siteVisited: true, landVerified: true, claimedArea: 80, verifiedArea: 80, findings: "Community has been using this area for generations.", verificationStatus: "COMPLETED" });
    await ClaimHistory.create({ claimId: c6._id, fromStage: "FRC_VERIFICATION", toStage: "GRAM_SABHA_DECISION", action: "FRC_VERIFICATION_COMPLETED", performedBy: frcOfficer._id, authorityId: frc._id });

    // ── Claim 7 — DLC stage ───────────────────────────────────────────────────
    const c7 = await makeClaim({ claimType: "IFR", beneficiary: bene3, unit: village2, claimDetails: { landArea: 2.8, landPurpose: "Agriculture", disputedLand: false }, stage: "DLC_REVIEW", status: "IN_PROCESS", submittedBy: admin });
    await ClaimVerification.create({ claimId: c7._id, authorityId: frc._id, verifiedBy: frcOfficer._id, siteVisited: true, landVerified: true, claimedArea: 2.8, verifiedArea: 2.7, findings: "Long term occupancy confirmed.", verificationStatus: "COMPLETED" });
    await ClaimHistory.create({ claimId: c7._id, fromStage: "FRC_VERIFICATION", toStage: "GRAM_SABHA_DECISION", action: "FRC_VERIFICATION_COMPLETED", performedBy: frcOfficer._id });
    await ClaimDecision.create({ claimId: c7._id, authorityId: gramSabha._id, decisionLevel: "GRAM_SABHA", decision: "RECOMMENDED", decidedBy: gramOfficer._id, resolutionNumber: "GS/PNK/2024/002" });
    await ClaimHistory.create({ claimId: c7._id, fromStage: "GRAM_SABHA_DECISION", toStage: "SDLC_REVIEW", action: "GRAM_SABHA_DECISION_RECOMMENDED", performedBy: gramOfficer._id });
    await ClaimDecision.create({ claimId: c7._id, authorityId: sdlc._id, decisionLevel: "SDLC", decision: "RECOMMENDED", decidedBy: sdlcOfficer._id });
    await ClaimHistory.create({ claimId: c7._id, fromStage: "SDLC_REVIEW", toStage: "DLC_REVIEW", action: "SDLC_DECISION_RECOMMENDED", performedBy: sdlcOfficer._id });

    console.log("Claims created with full workflow history");
    console.log("\n✅ Seed complete!\n");
    console.log("Login credentials (all password: password123):");
    console.log("  admin@fra.gov.in      — ADMIN");
    console.log("  frc@fra.gov.in        — OFFICER (FRC)");
    console.log("  gramsabha@fra.gov.in  — OFFICER (Gram Sabha)");
    console.log("  sdlc@fra.gov.in       — OFFICER (SDLC)");
    console.log("  dlc@fra.gov.in        — OFFICER (DLC)");
    console.log("  viewer@fra.gov.in     — VIEWER\n");

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
