import { z } from "zod";

const name = z.string().trim().min(2, "Enter at least 2 characters.").max(100, "Use 100 characters or fewer.");
const email = z.string().trim().email("Enter a valid email address.").max(254, "Use 254 characters or fewer.");
const phone = z.string().trim().min(7, "Enter a valid phone number.").max(30, "Use 30 characters or fewer.").regex(/^[+\d][\d\s()-]+$/, "Use numbers and standard phone symbols only.");
const message = z.string().trim().min(10, "Enter at least 10 characters.").max(1500, "Use 1,500 characters or fewer.");
const privacy = z.literal(true, { error: "Please acknowledge the privacy notice." });

export const admissionsEnquirySchema = z.object({ name, email, phone, intendedClass: z.enum(["Nursery", "P1", "P2", "P3", "P4", "P5", "P6", "P7"], { error: "Select an intended class." }), message, privacy });
export const contactEnquirySchema = z.object({ name, email, phone, message, privacy });
export type AdmissionsEnquiry = z.infer<typeof admissionsEnquirySchema>;
export type ContactEnquiry = z.infer<typeof contactEnquirySchema>;
