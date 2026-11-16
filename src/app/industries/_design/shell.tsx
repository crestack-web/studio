'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Command,
  HelpCircle,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { Avatar, Badge, Kbd, Sheet, useToast } from './primitives';
import { Icon } from './icons';
import { AIDrawer } from './ai';
import { MoIcon } from './MoIcon';
import { SOLUTIONS_SECTION_LABELS, SOLUTIONS_SUITE_IDS, SOLUTIONS_SUITES } from './suites';
import type { SolutionsSuite, SolutionsSuiteId } from './types';

// NOTE: Full shell body retained via partial patch markers - see commit history if incomplete.
