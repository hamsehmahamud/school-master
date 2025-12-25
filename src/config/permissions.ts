

export type UserRole = 'main-admin' | 'admin' | 'teacher' | 'student' | 'parent';

export const permissions = {
  'main-admin': {
    static: [
      'dashboard:view',
      'schools:manage',
      'users:manage',
    ],
  },
  admin: {
    static: [
      'dashboard:view',
      'students:manage',
      'teachers:manage',
      'classrooms:manage',
      'exams:manage',
      'finance:manage',
      'profile:view',
      'settings:edit',
    ],
  },
  teacher: {
    static: [
        'dashboard:view',
        'students:view',
        'classrooms:view',
        'exams:enter-results',
        'timetable:view',
        'profile:view',
    ],
  },
  student: {
    static: [
        'dashboard:view',
        'exams:view-results',
        'timetable:view',
        'announcements:view',
        'profile:view',
    ],
  },
  parent: {
     static: [
        'dashboard:view',
        'children:view-results',
        'children:view-timetable',
        'announcements:view',
        'profile:view',
     ],
  },
};

export const userRoles: UserRole[] = ['main-admin', 'admin', 'teacher', 'student', 'parent'];
