import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Bell, Calendar } from 'lucide-react';
import apiClient from '../../../services/api';
import { ConfirmDialog, AlertDialog } from '../../../components/ui/dialog';
import EmptyState from '../../../components/ui/empty-state';

const NoticePage = () => {
  const { t } = useTranslation();
  const [notices, setNotices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    startTime: '',
    endTime: '',
    brandId: '',
    workspaceId: '',
    status: 'published'
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, noticeId: null, noticeTitle: '' });
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [noticesData, brandsData] = await Promise.all([
        apiClient.getNotices(),
        apiClient.getBrands()
      ]);
      // Handle API response format
      setNotices(Array.isArray(noticesData) ? noticesData : (noticesData?.data || []));
      setBrands(Array.isArray(brandsData) ? brandsData : (brandsData?.data || []));
    } catch (error) {
      console.error('Load data failed:', error);
      // Use mock data for development
      setNotices([
        {
          id: 1,
          title: 'System Maintenance Notice',
          content: 'The system will be under maintenance on Sunday from 2:00 AM to 4:00 AM.',
          startTime: '2024-01-20T02:00:00',
          endTime: '2024-01-20T04:00:00',
          brandId: 'brand_1',
          workspaceId: 'workspace_1',
          status: 'published',
          createdAt: '2024-01-15T10:00:00'
        },
        {
          id: 2,
          title: 'New Feature Release',
          content: 'We have released new agent monitoring features. Please check the documentation.',
          startTime: '2024-01-15T00:00:00',
          endTime: '2024-01-30T23:59:59',
          brandId: 'brand_1',
          workspaceId: '',
          status: 'published',
          createdAt: '2024-01-15T09:00:00'
        }
      ]);
      setBrands([
        { id: 'brand_1', name: 'Brand A' },
        { id: 'brand_2', name: 'Brand B' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaces = async (brandId) => {
    if (!brandId) {
      setWorkspaces([]);
      return;
    }
    try {
      const data = await apiClient.getBrandWorkspaces(brandId);
      setWorkspaces(data);
    } catch (error) {
      console.error('Load workspaces failed:', error);
      setWorkspaces([
        { id: 'workspace_1', name: 'Workspace A' },
        { id: 'workspace_2', name: 'Workspace B' }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        const updatedNotice = await apiClient.updateNotice(editingNotice.id, formData);
        setNotices(notices.map(notice => notice.id === editingNotice.id ? updatedNotice : notice));
        setAlertDialog({
          open: true,
          type: 'success',
          title: t('messages.updateSuccess'),
          message: 'Notice updated successfully'
        });
      } else {
        const newNotice = await apiClient.createNotice(formData);
        setNotices([newNotice, ...notices]);
        setAlertDialog({
          open: true,
          type: 'success',
          title: t('messages.addSuccess'),
          message: 'Notice added successfully'
        });
      }
      setShowModal(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', startTime: '', endTime: '', brandId: '', workspaceId: '', status: 'published' });
    } catch (error) {
      console.error('Save notice failed:', error);
      // Mock success for development
      const mockNotice = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      if (editingNotice) {
        setNotices(notices.map(notice => notice.id === editingNotice.id ? mockNotice : notice));
      } else {
        setNotices([mockNotice, ...notices]);
      }
      setShowModal(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', startTime: '', endTime: '', brandId: '', workspaceId: '', status: 'published' });
      setAlertDialog({
        open: true,
        type: 'success',
        title: t('messages.addSuccess'),
        message: 'Notice saved successfully (mock)'
      });
    }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      startTime: notice.startTime?.slice(0, 16) || '',
      endTime: notice.endTime?.slice(0, 16) || '',
      brandId: notice.brandId || '',
      workspaceId: notice.workspaceId || '',
      status: notice.status
    });
    if (notice.brandId) {
      loadWorkspaces(notice.brandId);
    }
    setShowModal(true);
  };

  const handleDelete = (notice) => {
    setDeleteDialog({
      open: true,
      noticeId: notice.id,
      noticeTitle: notice.title
    });
  };

  const confirmDeleteNotice = async () => {
    const { noticeId } = deleteDialog;
    try {
      await apiClient.deleteNotice(noticeId);
      setNotices(notices.filter(notice => notice.id !== noticeId));
      setAlertDialog({
        open: true,
        type: 'success',
        title: t('messages.deleteSuccess'),
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      console.error('Delete notice failed:', error);
      // Mock success for development
      setNotices(notices.filter(notice => notice.id !== noticeId));
      setAlertDialog({
        open: true,
        type: 'success',
        title: t('messages.deleteSuccess'),
        message: 'Notice deleted successfully (mock)'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getNoticeStatus = (notice) => {
    const now = new Date();
    const startTime = new Date(notice.startTime);
    const endTime = new Date(notice.endTime);
    
    if (notice.status === 'draft') return 'draft';
    if (now > endTime) return 'expired';
    if (now >= startTime && now <= endTime) return 'published';
    return 'draft';
  };

  const filteredNotices = (Array.isArray(notices) ? notices : []).filter(notice =>
    notice && notice.title && notice.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('notice.management')}</h1>
          <p className="text-gray-600">Manage system notices and announcements</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('notice.addNotice')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notice title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('notice.noticeList')} ({filteredNotices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('common.loading')}</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <EmptyState 
              type="notices" 
              title="No Notices Found" 
              description="No notice data available at the moment." 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t('notice.title')}</th>
                    <th className="text-left py-3 px-4">{t('notice.brand')}</th>
                    <th className="text-left py-3 px-4">{t('notice.startTime')}</th>
                    <th className="text-left py-3 px-4">{t('notice.endTime')}</th>
                    <th className="text-left py-3 px-4">{t('common.status')}</th>
                    <th className="text-left py-3 px-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotices.map(notice => {
                    const status = getNoticeStatus(notice);
                    const brand = brands.find(b => b.id === notice.brandId);
                    return (
                      <tr key={notice.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{notice.title}</td>
                        <td className="py-3 px-4 text-gray-600">{brand?.name || 'All Brands'}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(notice.startTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(notice.endTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                            {t(`notice.${status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(notice)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              {t('common.edit')}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(notice)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              {t('common.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingNotice ? 'Edit Notice' : t('notice.addNotice')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('notice.title')} *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder={t('notice.enterTitle')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('notice.content')} *</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="4"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder={t('notice.enterContent')}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('notice.startTime')} *</label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('notice.endTime')} *</label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('notice.brand')}</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.brandId}
                    onChange={(e) => {
                      setFormData({...formData, brandId: e.target.value, workspaceId: ''});
                      loadWorkspaces(e.target.value);
                    }}
                  >
                    <option value="">{t('notice.selectBrand')}</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('notice.workspace')}</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.workspaceId}
                    onChange={(e) => setFormData({...formData, workspaceId: e.target.value})}
                    disabled={!formData.brandId}
                  >
                    <option value="">{t('notice.selectWorkspace')}</option>
                    {workspaces.map(workspace => (
                      <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('common.status')}</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="published">{t('notice.published')}</option>
                  <option value="draft">{t('notice.draft')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingNotice(null);
                    setFormData({ title: '', content: '', startTime: '', endTime: '', brandId: '', workspaceId: '', status: 'published' });
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {editingNotice ? 'Update' : t('common.add')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, noticeId: null, noticeTitle: '' })}
        onConfirm={confirmDeleteNotice}
        type="danger"
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteDialog.noticeTitle}"? This action cannot be undone.`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />

      {/* Alert Dialog */}
      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </div>
  );
};

export default NoticePage;