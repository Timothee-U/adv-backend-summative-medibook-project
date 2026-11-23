USE medibook;

INSERT INTO patients (full_name, email, phone) VALUES
('Ama Mensah', 'ama@mail.com', '0244-111-222'),
('Kojo Owusu', 'kojo@mail.com', '0555-333-444'),
('Aline Uwase', 'aline@mail.com', '0788-555-666');

INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES
('Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
('Dr. Adjei', 'Paediatrics', 100.00, 'R-03'),
('Dr. Kamanzi', 'General Practice', 120.00, 'R-07');

-- Dr. Boateng on 2026-12-01 has 11 of 12 slots taken (near the daily cap)
-- Dr. Kamanzi has no appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, amount_paid) VALUES
(1, 1, '2026-12-01 09:00:00', 150.00),
(2, 1, '2026-12-01 09:30:00', 150.00),
(3, 1, '2026-12-01 10:00:00', 150.00),
(1, 1, '2026-12-01 10:30:00', 150.00),
(2, 1, '2026-12-01 11:00:00', 150.00),
(3, 1, '2026-12-01 11:30:00', 150.00),
(1, 1, '2026-12-01 12:00:00', 150.00),
(2, 1, '2026-12-01 12:30:00', 150.00),
(3, 1, '2026-12-01 13:00:00', 150.00),
(1, 1, '2026-12-01 13:30:00', 150.00),
(2, 1, '2026-12-01 14:00:00', 150.00),
(1, 2, '2026-12-02 10:00:00', 100.00),
(3, 2, '2026-12-03 10:30:00', 100.00);

-- cancelled with 27 hours notice, so 50% refund
INSERT INTO appointments
  (patient_id, doctor_id, appointment_datetime, amount_paid, status, refund_amount, cancelled_at)
VALUES
  (2, 2, '2026-11-10 11:00:00', 100.00, 'cancelled', 50.00, '2026-11-09 08:00:00');