import { baseApi } from '../baseApi';

const customerOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCustomerOrders: builder.query({
      query: (query) => ({
        url: '/customer-orders',
        method: 'GET',
        params: query
      }),
      providesTags: ['customerOrders']
    }),
    confirmCustomerOrder: builder.mutation({
      query: (id) => ({
        url: `/customer-orders/${id}/confirm`,
        method: 'PATCH'
      }),
      invalidatesTags: ['customerOrders']
    })
  })
});

export const { useGetAllCustomerOrdersQuery, useConfirmCustomerOrderMutation } = customerOrderApi;
