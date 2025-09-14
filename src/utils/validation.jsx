// 排班衝突檢測
export const checkScheduleConflict = (newSchedule, existingSchedules) => {
  const conflicts = [];
  
  for (const existing of existingSchedules) {
    // 檢查同一使用者的時間重疊
    if (existing.userId === newSchedule.userId) {
      const newStart = new Date(newSchedule.startAt);
      const newEnd = new Date(newSchedule.endAt);
      const existingStart = new Date(existing.startAt);
      const existingEnd = new Date(existing.endAt);
      
      if (newStart < existingEnd && existingStart < newEnd) {
        conflicts.push({
          type: 'time_overlap',
          message: `時間衝突: 與現有排班 ${existing.shiftName} 重疊`,
          conflictWith: existing
        });
      }
    }
  }
  
  return conflicts;
};

// 請假餘額檢查
export const checkLeaveBalance = (leaveRequest, userBalance) => {
  const { typeCode, days } = leaveRequest;
  const balance = userBalance[typeCode];
  
  if (!balance) {
    return { valid: false, message: '找不到假別餘額資訊' };
  }
  
  if (balance.remaining < days) {
    return { 
      valid: false, 
      message: `餘額不足: 剩餘 ${balance.remaining} 天，申請 ${days} 天` 
    };
  }
  
  return { valid: true };
};

// 跨日班別時間計算
export const calculateCrossDayShift = (date, startTime, endTime, timezone = 'Asia/Taipei') => {
  const startDateTime = new Date(`${date}T${startTime}`);
  let endDateTime = new Date(`${date}T${endTime}`);
  
  // 如果結束時間小於開始時間，表示跨日
  if (endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  
  return {
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    isCrossDay: endDateTime.getDate() !== startDateTime.getDate()
  };
};

// 表單驗證
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  const errors = [];
  if (password.length < minLength) errors.push(`至少 ${minLength} 個字元`);
  if (!hasUpperCase) errors.push('包含大寫字母');
  if (!hasLowerCase) errors.push('包含小寫字母');
  if (!hasNumbers) errors.push('包含數字');
  
  return {
    valid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak'
  };
};