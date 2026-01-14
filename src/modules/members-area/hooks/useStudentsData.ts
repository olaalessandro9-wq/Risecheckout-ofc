/**
 * StudentsTab - Students Data Hook
 * 
 * Responsible for:
 * - Fetch students via Edge Function
 * - Fetch groups
 * - Manage producer student display
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MemberGroup, BuyerWithGroups, StudentStats, StudentFilters } from "@/modules/members-area/types";
import { studentsService } from "../services/students.service";

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
    
    const { data, error } = await supabase
      .from('product_member_groups')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
      return;
    }

    setGroups(data || []);
  }, [productId]);

  const fetchStudents = useCallback(async (search = searchQuery) => {
    if (!productId) return;
    setIsLoading(true);
    
    try {
      // Get producer info for local display
      const { data: productData } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', productId)
        .single();

      const producerId = productData?.user_id;
      let producerStudent: BuyerWithGroups | null = null;

      if (producerId) {
        const { data: producerProfile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', producerId)
          .single();

        const { data: producerEmail } = await supabase
          .rpc('get_user_email', { user_id: producerId });

        producerStudent = {
          buyer_id: producerId,
          buyer_email: producerEmail || '',
          buyer_name: producerProfile?.name || null,
          groups: [],
          access_type: 'producer',
          last_access_at: null,
          progress_percent: 0,
          status: 'active',
        };
      }

      // Fetch students via Edge Function (bypasses RLS)
      const { data, error } = await studentsService.list(productId, {
        page,
        limit,
        search: search || undefined,
        access_type: filters.accessType && filters.accessType !== 'producer' ? filters.accessType : undefined,
        status: filters.status || undefined,
        group_id: filters.groupId || undefined,
      });

      if (error) {
        console.error('Error fetching students from service:', error);
        toast.error('Erro ao carregar alunos');
        setIsLoading(false);
        return;
      }

      const response = data as StudentsServiceResponse | null;
      const studentsList = response?.students || [];
      const backendTotal = response?.total || 0;
      const backendStats = response?.stats;

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
    } catch (error) {
      console.error('Error fetching students:', error);
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
