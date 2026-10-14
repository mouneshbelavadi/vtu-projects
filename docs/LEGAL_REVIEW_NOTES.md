# Legal Review Notes for Legal Counsel

This document highlights specific clauses and operational practices across VTU Adda Projects that require formal review by qualified Indian legal counsel prior to commercial launch.

## 1. Age of Consent and Minors (Digital Personal Data Protection Act, 2023)
* Context: Engineering students in India often begin their 1st or 2nd year at 17 years old.
* Clause location: Terms & Conditions (Section 3) and Privacy Policy (Section 6).
* Review requirement: Confirm whether accepting self-declared parental consent during registration satisfies the obligations under Section 9 of the DPDP Act 2023 regarding the processing of personal data of children, or if verifiable parental consent mechanisms are mandatory for users aged 17.

## 2. Retention Periods and Data Minimisation
* Context: Payment proof screenshots uploaded via manual UPI checkout are retained for a configurable window (default 30 days) and purged by automated cron jobs. Order, UTR, and financial ledger data are retained for 7 years.
* Clause location: Privacy Policy (Section 4).
* Review requirement: Confirm alignment with the Income Tax Act 1961 (retention of books of account for 6 years from the end of the relevant assessment year) and Section 8(7) of the DPDP Act 2023 regarding data erasure once the specified purpose has been served.

## 3. Limitation of Liability and Academic Disclaimers
* Context: The platform sells source code kits, custom engineering project modules, and mentorship sessions for educational purposes only. It expressly disclaims VTU or college approval, grades, or passing guarantees.
* Clause location: Terms & Conditions (Section 8 and Section 11) and Academic Integrity Policy.
* Review requirement: Ensure the limitation of liability clause (capping liability to the purchase price paid) and consumer protection disclaimers comply with the Consumer Protection Act 2019 and Indian Contract Act 1872.

## 4. Refund Terms and Cancellation Policy
* Context: Digital goods (source code downloads) are non-refundable once downloaded. Mentorship sessions require 24 hours advance notice for cancellation. Custom requests feature non-refundable initial deposits.
* Clause location: Refund Policy.
* Review requirement: Ensure compliance with Consumer Protection (E-Commerce) Rules 2020 regarding cancellation charges and transparent refund timelines for digital products and online services.

## 5. Governing Law and Exclusive Jurisdiction
* Context: All disputes are submitted to the exclusive jurisdiction of the competent civil courts in Bengaluru, Karnataka, India, governed by the laws of India.
* Clause location: Terms & Conditions (Section 13).
* Review requirement: Validate the enforceability of exclusive court jurisdiction clauses in consumer agreements under the Code of Civil Procedure 1908.

## 6. Cross-Border Data Processing
* Context: The primary PostgreSQL database sits in AWS ap-south-1 (Mumbai), and hosting sits at Vercel's Mumbai edge (bom1). Transactional emails are dispatched via Resend, whose primary processing endpoints are in the United States.
* Clause location: Privacy Policy (Section 5).
* Review requirement: Confirm cross-border data transfer compliance under Section 16 of the DPDP Act 2023, specifically that transfers to email relay services outside India are permissible subject to Central Government notifications.
