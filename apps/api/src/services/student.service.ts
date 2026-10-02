import type { Student } from '@checkin/shared';
import { normalizeStudentCode } from '@checkin/shared';
import { supabase } from '../utils/supabase.js';

export async function listStudents(query: string): Promise<Student[]> {
  if (!supabase) throw new Error('Supabase not configured');
  
  let req = supabase.from('students').select('*').order('student_code');
  const keyword = query.trim().toUpperCase();
  
  if (keyword) {
    req = req.or(`student_code.ilike.%${keyword}%,full_name.ilike.%${keyword}%,class_name.ilike.%${keyword}%`);
  }
  
  const { data, error } = await req;
  if (error) throw new Error(`Loi tai danh sach sinh vien: ${error.message}`);
  
  return (data || []).map((row: any) => ({
    studentCode: row.student_code,
    fullName: row.full_name,
    className: row.class_name,
    subject: row.subject ?? undefined,
    faculty: row.faculty ?? undefined,
    email: row.email ?? undefined,
  }));
}

export async function getStudent(studentCode: string): Promise<Student | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('students').select('*').eq('student_code', normalizeStudentCode(studentCode)).single();
  if (error || !data) return null;
  return {
    studentCode: data.student_code,
    fullName: data.full_name,
    className: data.class_name,
    subject: data.subject ?? undefined,
    faculty: data.faculty ?? undefined,
    email: data.email ?? undefined,
  };
}

export async function upsertStudents(students: Student[]): Promise<{ upserted: number }> {
  if (!supabase) throw new Error('Supabase not configured');
  if (students.length === 0) return { upserted: 0 };

  const rows = students.map(s => ({
    student_code: normalizeStudentCode(s.studentCode),
    full_name: s.fullName,
    class_name: s.className,
    subject: s.subject ?? null,
    faculty: s.faculty ?? null,
    email: s.email ?? null,
  }));

  const { error } = await supabase.from('students').upsert(rows, { onConflict: 'student_code' });
  if (error) throw new Error(`Loi import sinh vien: ${error.message}`);

  return { upserted: students.length };
}

export async function deleteStudent(studentCode: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('students').delete().eq('student_code', normalizeStudentCode(studentCode));
  return !error;
}

export async function deleteClass(className: string): Promise<{ deleted: number }> {
  if (!supabase) return { deleted: 0 };
  
  // Need to get count first or just delete and return 1 (fake count) since supabase JS doesn't easily return deleted rows count without select
  const { count, error } = await supabase.from('students').delete().eq('class_name', className).select('student_code');
  if (error) throw new Error(`Loi xoa lop: ${error.message}`);
  
  return { deleted: count || 0 };
}
