export type AttendanceResultCode =
  | 'SUCCESS'
  | 'ALREADY_CHECKED'
  | 'OUT_OF_RANGE'
  | 'SESSION_CLOSED'
  | 'STUDENT_NOT_FOUND'
  | 'INVALID_INPUT';

export interface Student {
  studentCode: string;
  fullName: string;
  className: string;
  subject?: string;
  faculty?: string;
  email?: string;
}

export interface CheckinSession {
  id: string;
  title: string;
  subject?: string;
  className?: string;
  latCenter: number;
  lngCenter: number;
  radiusM: number;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'closed';
  qrPayload?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentCode: string;
  checkedAt: string;
  distanceM: number;
  lat: number;
  lng: number;
}

export interface AttendRequest {
  sessionId: string;
  studentCode: string;
  lat: number;
  lng: number;
  accuracyM?: number;
  deviceId?: string;
}

export interface ApiResponse<T> {
  code: AttendanceResultCode;
  message: string;
  data: T;
}

export interface AttendSuccessData {
  attendance: AttendanceRecord;
  distanceM: number;
}

export const DEFAULT_RADIUS_M = 2000;

export const EXCEL_COLUMNS = ['MSSV', 'HoTen', 'Lop', 'MonHoc', 'Khoa', 'Email'] as const;
