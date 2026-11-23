CREATE DATABASE IF NOT EXISTS medibook;
USE medibook;

DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;

CREATE TABLE patients (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_email (email)
);

CREATE TABLE doctors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  consultation_fee DECIMAL(10,2) NOT NULL,
  room VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_doctors_fee CHECK (consultation_fee >= 0)
);

CREATE TABLE appointments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id INT UNSIGNED NOT NULL,
  doctor_id INT UNSIGNED NOT NULL,
  appointment_datetime DATETIME NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  status ENUM('booked', 'cancelled') NOT NULL DEFAULT 'booked',
  refund_amount DECIMAL(10,2) NULL,
  cancelled_at DATETIME NULL,
  booked_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active_slot DATETIME GENERATED ALWAYS AS (IF(status = 'booked', appointment_datetime, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctor_active_slot (doctor_id, active_slot),
  KEY idx_doctor_datetime (doctor_id, appointment_datetime),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT,
  CONSTRAINT fk_appt_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE RESTRICT,
  CONSTRAINT chk_appt_amount CHECK (amount_paid >= 0),
  CONSTRAINT chk_appt_slot CHECK (
    MINUTE(appointment_datetime) IN (0, 30)
    AND SECOND(appointment_datetime) = 0
    AND TIME(appointment_datetime) BETWEEN '09:00:00' AND '16:30:00'
  ),
  CONSTRAINT chk_appt_cancel CHECK (
    (status = 'booked' AND refund_amount IS NULL AND cancelled_at IS NULL)
    OR (status = 'cancelled' AND refund_amount IS NOT NULL AND cancelled_at IS NOT NULL
        AND refund_amount >= 0 AND refund_amount <= amount_paid)
  )
);