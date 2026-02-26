import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import ModalForm from '../components/ModalForm';
import ConfirmDialog from '../components/ConfirmDialog';
import * as labApi from '../services/labApi';
import * as roomApi from '../services/roomApi';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  short_name: z.string().min(1, 'Short name required'),
  code: z.string().min(1, 'Code required'),
  room: z.string().optional(),
  capacity: z.coerce.number().int().min(0).optional().default(0),
});

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'short_name', label: 'Short Name', hideOnMobile: true },
  { key: 'code', label: 'Code', hideOnMobile: true },
  {
    key: 'room',
    label: 'Room',
    render: (val, row) => {
      const room = row.room;
      if (!room) return <span className="text-gray-400">—</span>;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          room.type === 'lab' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`} title={room.name}>
          {room.code}
        </span>
      );
    },
  },
  { key: 'capacity', label: 'Capacity', hideOnMobile: true },
];

export default function Labs() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roomList, setRoomList] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labApi.getLabs({ page, limit, search });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await roomApi.getRooms({ limit: 500 });
        setRoomList(res.data || []);
      } catch {
        // non-blocking
      }
    };
    if (modalOpen) loadRooms();
  }, [modalOpen]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', short_name: '', code: '', room: '', capacity: 0 },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', short_name: '', code: '', room: '', capacity: 0 });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const roomId = row.room && typeof row.room === 'object' ? row.room._id : (row.room || '');
    reset({
      name: row.name,
      short_name: row.short_name,
      code: row.code,
      room: roomId,
      capacity: row.capacity ?? 0,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await labApi.updateLab(editing._id, values);
        toast.success('Lab updated');
      } else {
        await labApi.createLab(values);
        toast.success('Lab created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await labApi.deleteLab(deleteTarget._id);
      toast.success('Lab deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tableData = data.map((row) => ({
    ...row,
    _actions: (
      <div className="flex gap-2">
        <button
          onClick={() => openEdit(row)}
          className="px-2 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600"
        >
          Edit
        </button>
        <button
          onClick={() => setDeleteTarget(row)}
          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Labs</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search.." />
          <button
            onClick={openCreate}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
            title="Add Lab"
          >
            +
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={tableData} loading={loading} emptyMessage="No labs" />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />

      <ModalForm open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lab' : 'Add Lab'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input {...register('name')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
            <input {...register('short_name')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
            {errors.short_name && <p className="text-red-500 text-sm mt-1">{errors.short_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input {...register('code')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" disabled={!!editing} />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
            <select {...register('room')} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500">
              <option value="">No room assigned</option>
              {roomList
                .filter((room) => room.type === 'lab')
                .map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name} ({room.code})
                  </option>
                ))}
            </select>
            {errors.room && <p className="text-red-500 text-sm mt-1">{errors.room.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input {...register('capacity')} type="number" min={0} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Lab"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
