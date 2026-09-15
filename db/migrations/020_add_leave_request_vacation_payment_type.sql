ALTER TABLE leave_requests
  ADD COLUMN vacation_payment_type ENUM('time', 'money', 'time_money') NULL AFTER leave_class;
