# Security Specification & Threat Model

## 1. Data Invariants

- **Cars (`/cars/{carId}`)**:
  - Publicly readable to allow catalog browsing.
  - Only authenticated administrators can create, update, or delete inventory vehicles.
  - Price, year, and mileage must be non-negative numbers.
  - Valid status can only be 'Disponible', 'Reservado', or 'Vendido'.

- **Inquiries (`/inquiries/{inquiryId}`)**:
  - Anyone (public/unauthenticated) can submit an inquiry, valuation, or financing request.
  - Required fields: `id`, `type`, `name`, `phone`, `email`, `status`, `createdAt`.
  - Inquiries are confidential: only administrators can read, list, update, or delete inquiry submissions to protect customer contact information and trade-in data.

- **Reviews (`/reviews/{reviewId}`)**:
  - Anyone can read reviews to see customer testimonials.
  - Unauthenticated or authenticated users can submit a review with valid rating between 1 and 5.
  - Only administrators can update or delete reviews (e.g. moderation).

- **Customers (`/customers/{customerId}`) & Quotations (`/quotations/{quotationId}`)**:
  - Strict confidentiality: Only administrators can read, list, create, update, or delete CRM client profiles and commercial quotations.

- **Admins (`/admins/{adminId}`)**:
  - Only accessible to authenticated users. Modifications are blocked from client SDK.
  - Admin email bootstrap includes `GermanMountrichas@gmail.com`.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Payload 1 (Ghost Vehicle Injection by Non-Admin)**:
   - An unauthenticated visitor tries to write `POST /cars/malicious-car` with a spoofed car listing. Expected: `PERMISSION_DENIED`.

2. **Payload 2 (Inventory Price Tampering)**:
   - An unauthorized client attempts to update `/cars/car-1` setting `priceUsd: 1`. Expected: `PERMISSION_DENIED`.

3. **Payload 3 (Arbitrary Field Injection in Car Document)**:
   - An attacker attempts to append an undeclared schema field `isFreeVehicle: true` to a car document. Expected: `PERMISSION_DENIED`.

4. **Payload 4 (Inquiry Listing Leak Attack)**:
   - A non-admin user queries `GET /inquiries` trying to scrape customer phone numbers and emails. Expected: `PERMISSION_DENIED`.

5. **Payload 5 (Inquiry Deletion by Unauthorized User)**:
   - An attacker tries to execute `DELETE /inquiries/inq-123` to wipe leads. Expected: `PERMISSION_DENIED`.

6. **Payload 6 (Oversized Review Comment DOS)**:
   - An attacker sends a 2MB comment string inside `/reviews/rev-attack` to cause Denial of Wallet. Expected: `PERMISSION_DENIED`.

7. **Payload 7 (Invalid Rating Injection)**:
   - An attacker submits a review with `rating: 99` or `rating: -5`. Expected: `PERMISSION_DENIED`.

8. **Payload 8 (CRM Customer Access by Public)**:
   - An anonymous attacker attempts `GET /customers/cust-123` to read private customer identity document and address. Expected: `PERMISSION_DENIED`.

9. **Payload 9 (Customer Modification by Contributor)**:
   - A non-admin authenticated user attempts `PATCH /customers/cust-1` modifying bank or phone details. Expected: `PERMISSION_DENIED`.

10. **Payload 10 (Quotation Forgery Attack)**:
    - An attacker writes a discounted proposal directly into `/quotations/quot-fake` with `status: 'Aprobada'` and `finalPriceUsd: 100`. Expected: `PERMISSION_DENIED`.

11. **Payload 11 (Admin Self-Promotion)**:
    - A standard user tries to write `POST /admins/{uid}` to elevate themselves to superadmin. Expected: `PERMISSION_DENIED`.

12. **Payload 12 (ID Poisoning Attack)**:
    - An attacker attempts to target a document with an invalid 1000-character injection ID `GET /cars/../../../malicious-path`. Expected: `PERMISSION_DENIED`.

---

## 3. Test Runner Definition

The invariants and payloads are verified against the defined rules in `firestore.rules`.
