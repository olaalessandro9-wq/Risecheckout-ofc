/**
 * StudentsTab - Students Data Hook
 * 
 * Responsible for:
 * - Fetch students via Edge Function
 * - Fetch groups
 * - Manage producer student display
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { MemberGroup, BuyerWithGroups, StudentStats, StudentFilters } from "@/modules/members-area/types";
import { studentsService } from "../services/students.service";

const log = createLogger("useStudentsData");

interface UseStudentsDataProps {
  productId?: string;
  page: number;
  limit: number;
  filters: StudentFilters;
  searchQuery: string;
}

interface UseStudentsDataReturn {
  students: BuyerWithGroups[];
  groups: MemberGroup[];
  total: number;
  stats: StudentStats;
  isLoading: boolean;
  fetchStudents: (search?: string) => Promise<void>;
  fetchGroups: () => Promise<void>;
}

/** Response shape from students service */
interface StudentsServiceResponse {
  students: BuyerWithGroups[];
  total: number;
  stats?: StudentStats;
}

interface GroupsResponse {
  groups?: MemberGroup[];
}

interface ProducerInfoResponse {
  producer_info?: {
    id: string;
    email?: string;
    name?: string;
  };
}

/**
 * Data fetching hook for Students Tab
 */
export function useStudentsData({
  productId,
  page,
  limit,
  filters,
  searchQuery,
}: UseStudentsDataProps): UseStudentsDataReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<BuyerWithGroups[]>([]);
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    averageProgress: 0,
    completionRate: 0,
  });

  const fetchGroups = useCallback(async () => {
    if (!productId) return;
    
    const { data, error } = await api.call<GroupsResponse>('students-groups', {
      action: 'list-groups',
      product_id: productId,
    });

    if (error) {
      log.error("Error fetching groups:", error);
      return;
    }

    setGroups(data?.groups || []);
  }, [productId]);

  const fetchStudents = useCallback(async (search = searchQuery) => {
    if (!productId) return;
    setIsLoading(true);
    
    try {
      // Fetch students via Edge Function
      const { data: studentsData, error: studentsError } = await studentsService.list(productId, {
        page,
        limit,
        search: search || undefined,
        access_type: filters.accessType && filters.accessType !== 'producer' ? filters.accessType : undefined,
        status: filters.status || undefined,
        group_id: filters.groupId || undefined,
      });

      if (studentsError) {
        log.error("Error fetching students from service:", studentsError);
        toast.error('Erro ao carregar alunos');
        setIsLoading(false);
        return;
      }

      const response = studentsData as StudentsServiceResponse | null;
      const studentsList = response?.students || [];
      const backendTotal = response?.total || 0;
      const backendStats = response?.stats;

      // Get producer info via Edge Function
      const { data: producerData } = await api.call<ProducerInfoResponse>('students-list', {
        action: 'get-producer-info',
        product_id: productId,
      });

      const producerInfo = producerData?.producer_info;
      let producerStudent: BuyerWithGroups | null = null;

      if (producerInfo) {
        producerStudent = {
          buyer_id: producerInfo.id,
          buyer_email: producerInfo.email || '',
          buyer_name: producerInfo.name || null,
          groups: [],
          access_type: 'producer',
          last_access_at: null,
          progress_percent: 0,
          status: 'active',
        };
      }

      // Combine producer + students
      let allStudents: BuyerWithGroups[] = [];
      
      const shouldIncludeProducer = !filters.accessType || filters.accessType === 'producer';
      const shouldIncludeStudents = !filters.accessType || filters.accessType !== 'producer';

      // Only show producer on first page, without group filter, and matching search
      const producerMatchesSearch = !search || 
        producerStudent?.buyer_email.toLowerCase().includes(search.toLowerCase()) ||
        producerStudent?.buyer_name?.toLowerCase().includes(search.toLowerCase());

      if (producerStudent && shouldIncludeProducer && !filters.groupId && page === 1 && producerMatchesSearch) {
        allStudents.push(producerStudent);
      }
      
      if (shouldIncludeStudents) {
        allStudents = [...allStudents, ...studentsList];
      }

      // Use backend stats if available, otherwise calculate
      if (backendStats) {
        const totalWithProducer = shouldIncludeProducer && !filters.groupId ? backendStats.totalStudents + 1 : backendStats.totalStudents;
        setStats({
          totalStudents: totalWithProducer,
          averageProgress: backendStats.averageProgress || 0,
          completionRate: backendStats.completionRate || 0,
        });
      } else {
        setStats({
          totalStudents: allStudents.length,
          averageProgress: 0,
          completionRate: 0,
        });
      }

      setStudents(allStudents);
      const displayTotal = shouldIncludeProducer && !filters.groupId && producerMatchesSearch ? backendTotal + 1 : backendTotal;
      setTotal(displayTotal);
    } catch (fetchError) {
      log.error("Error fetching students:", fetchError);
      toast.error('Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, limit, filters, searchQuery]);

  useEffect(() => {
    if (productId) {
      fetchGroups();
      fetchStudents();
    }
  }, [productId, fetchGroups, fetchStudents]);

  return {
    students,
    groups,
    total,
    stats,
    isLoading,
    fetchStudents,
    fetchGroups,
  };
}
