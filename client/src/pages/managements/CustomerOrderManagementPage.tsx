import { CheckOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Flex, Modal, Pagination, Table, Tag } from 'antd';
import { useState } from 'react';
import SearchInput from '../../components/SearchInput';
import toastMessage from '../../lib/toastMessage';
import {
  useConfirmCustomerOrderMutation,
  useGetAllCustomerOrdersQuery,
} from '../../redux/features/management/customerOrderApi';
import { ICustomerOrder } from '../../types/customerOrder.types';
import formatDate from '../../utils/formatDate';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'MMK',
  maximumFractionDigits: 0,
});

type TableOrder = {
  key: string;
  customerName: string;
  phone: string;
  address: string;
  items: string;
  totalPrice: string;
  status: ICustomerOrder['status'];
  date: string;
  order: ICustomerOrder;
};

const CustomerOrderManagementPage = () => {
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  const { data, isFetching } = useGetAllCustomerOrdersQuery(query);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const tableData = data?.data?.map((order: ICustomerOrder) => ({
    key: order._id,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    items: order.items
      .map((item) => `${item.productName} (${item.quantity})`)
      .join(', '),
    totalPrice: money.format(order.totalPrice),
    status: order.status,
    date: formatDate(order.createdAt),
    order,
  }));

  const columns: TableColumnsType<TableOrder> = [
    {
      title: 'Customer',
      key: 'customerName',
      dataIndex: 'customerName',
    },
    {
      title: 'Phone',
      key: 'phone',
      dataIndex: 'phone',
      align: 'center',
    },
    {
      title: 'Address',
      key: 'address',
      dataIndex: 'address',
      ellipsis: true,
    },
    {
      title: 'Items',
      key: 'items',
      dataIndex: 'items',
      ellipsis: true,
    },
    {
      title: 'Total',
      key: 'totalPrice',
      dataIndex: 'totalPrice',
      align: 'center',
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      align: 'center',
      render: (status: ICustomerOrder['status']) => (
        <Tag color={status === 'CONFIRMED' ? 'green' : 'gold'}>{status}</Tag>
      ),
    },
    {
      title: 'Order Date',
      key: 'date',
      dataIndex: 'date',
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, item) => <ConfirmOrderButton order={item.order} />,
      width: '1%',
    },
  ];

  return (
    <>
      <Flex justify='end' style={{ margin: '5px' }}>
        <SearchInput setQuery={setQuery} placeholder='Search Customer Orders...' />
      </Flex>
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
      <Flex justify='center' style={{ marginTop: '1rem' }}>
        <Pagination
          current={query.page}
          onChange={onChange}
          defaultPageSize={query.limit}
          total={data?.meta?.total}
        />
      </Flex>
    </>
  );
};

const ConfirmOrderButton = ({ order }: { order: ICustomerOrder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmCustomerOrder, { isLoading }] = useConfirmCustomerOrderMutation();

  const handleConfirm = async () => {
    try {
      const res = await confirmCustomerOrder(order._id).unwrap();

      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        setIsModalOpen(false);
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  if (order.status === 'CONFIRMED') {
    return <Tag color='green'>Confirmed</Tag>;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'green' }}
      >
        <CheckOutlined />
      </Button>
      <Modal
        title='Confirm Customer Order'
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Confirm this customer order?</h2>
          <h4>The order will move from pending to confirmed.</h4>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <Button onClick={() => setIsModalOpen(false)} type='primary' style={{ backgroundColor: 'lightseagreen' }}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} loading={isLoading} type='primary' style={{ backgroundColor: 'green' }}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CustomerOrderManagementPage;
