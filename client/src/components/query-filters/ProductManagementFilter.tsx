import {Col, Flex, Row, Slider} from 'antd';
import React from 'react';
import {useGetAllCategoriesQuery} from '../../redux/features/management/categoryApi';
import {useGetAllBrandsQuery} from '../../redux/features/management/brandApi';

export interface ProductManagementQuery {
  name: string;
  category: string;
  brand: string;
  limit: number;
  page: number;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductManagementFilterProps {
  query: ProductManagementQuery;
  setQuery: React.Dispatch<React.SetStateAction<ProductManagementQuery>>;
}

const ProductManagementFilter = ({query, setQuery}: ProductManagementFilterProps) => {
  const {data: categories} = useGetAllCategoriesQuery(undefined);
  const {data: brands} = useGetAllBrandsQuery(undefined);

  const updateQuery = (nextQuery: Partial<ProductManagementQuery>) => {
    setQuery((prev) => ({
      ...prev,
      ...nextQuery,
      page: 1,
    }));
  };

  return (
    <Flex
      style={{
        border: '1px solid grey',
        padding: '1rem',
        marginBottom: '.5rem',
        borderRadius: '1rem',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.4) inset',
      }}
    >
      <Row gutter={2} style={{width: '100%'}}>
        <Col xs={{span: 24}} md={{span: 8}}>
          <label style={{fontWeight: 700}}>Price Range</label>
          <Slider
            range
            step={100}
            max={20000}
            value={[query.minPrice ?? 0, query.maxPrice ?? 20000]}
            onChange={(value) => {
              updateQuery({
                minPrice: value[0],
                maxPrice: value[1],
              });
            }}
          />
        </Col>
        <Col xs={{span: 24}} md={{span: 8}}>
          <label style={{fontWeight: 700}}>Search by product name</label>
          <input
            type='text'
            value={query.name}
            className={`input-field`}
            placeholder='Search by Product Name'
            onChange={(e) => updateQuery({name: e.target.value})}
          />
        </Col>
        <Col xs={{span: 24}} md={{span: 4}}>
          <label style={{fontWeight: 700}}>Filter by Category</label>
          <select
            name='category'
            className={`input-field`}
            value={query.category}
            onChange={(e) => updateQuery({category: e.target.value})}
          >
            <option value=''>Filter by Category</option>
            {categories?.data?.map((category: {_id: string; name: string}) => (
              <option value={category._id} key={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </Col>
        <Col xs={{span: 24}} md={{span: 4}}>
          <label style={{fontWeight: 700}}>Filter by Brand</label>
          <select
            name='Brand'
            className={`input-field`}
            value={query.brand}
            onChange={(e) => updateQuery({brand: e.target.value})}
          >
            <option value=''>Filter by Brand</option>
            {brands?.data?.map((brand: {_id: string; name: string}) => (
              <option value={brand._id} key={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        </Col>
      </Row>
    </Flex>
  );
};

export default ProductManagementFilter;
