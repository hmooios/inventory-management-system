import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import userProPic from '../assets/User.png';
import CustomInput from '../components/CustomInput';
import { useForm } from 'react-hook-form';
import { profileInputFields } from '../constant/profile';
import {
  useGetSelfProfileQuery,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
} from '../redux/features/authApi';
import Loader from '../components/Loader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const EditProfilePage = () => {
  const { data, isLoading } = useGetSelfProfileQuery(undefined);
  const [uploadProfilePicture] = useUploadProfilePictureMutation();
  const navigate = useNavigate();

  if (isLoading) {
    return <Loader />;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];

    if (!image) {
      return;
    }

    if (!image.type.startsWith('image/')) {
      toast.error('Please select an image file');
      e.target.value = '';
      return;
    }

    if (image.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }

    const toastId = toast.loading('Uploading image...');
    const formData = new FormData();
    formData.append('avatar', image);

    try {
      const imgUploadRes = await uploadProfilePicture(formData).unwrap();

      if (imgUploadRes.success) {
        toast.success('Profile picture updated successfully', { id: toastId });
      } else {
        throw new Error('Failed to update profile image');
      }
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Failed to upload image';
      toast.error(message, { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <Row>
      <Col xs={{ span: 24 }} lg={{ span: 8 }}>
        <Flex align='center' vertical style={{ margin: '1rem 0' }}>
          <Flex
            justify='center'
            style={{
              width: '250px',
              height: '250px',
              border: '2px solid gray',
              padding: '.5rem',
              borderRadius: '50%',
            }}
          >
            <img
              src={data?.data?.avatar || userProPic}
              alt='user'
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </Flex>
          <Flex style={{ padding: '1rem' }}>
            <input
              type='file'
              name='avatar'
              id='avatar'
              placeholder='Change Profile Picture'
              accept='image/*'
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label
              htmlFor='avatar'
              style={{
                background: '#164863',
                color: '#fff',
                padding: '.5rem 1rem',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                fontSize: '1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <UploadOutlined />
              Change Profile Picture
            </label>
          </Flex>
        </Flex>
      </Col>
      <Col xs={{ span: 24 }} lg={{ span: 16 }}>
        <Flex justify='end' style={{ margin: '1rem 0' }}>
          <Button type='default' onClick={() => navigate('/profile')}>
            <ArrowLeftOutlined /> Go Back
          </Button>
        </Flex>
        <EditProfileForm data={data?.data} />
      </Col>
    </Row>
  );
};

export default EditProfilePage;

const EditProfileForm = ({ data }: { data: any }) => {
  const navigate = useNavigate();
  const [updateProfile] = useUpdateProfileMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: data });

  const onSubmit = async (data: any) => {
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;

    for (const key in data) {
      if (data[key] === '' || data[key] === undefined || data[key] === null || !data[key]) {
        delete data[key];
      }
    }

    const toastId = toast.loading('Updating profile...');
    try {
      const res = await updateProfile(data).unwrap();

      if (res.success) {
        toast.success('Profile updated successfully', { id: toastId });
        navigate('/profile');
      }
    } catch (error) {
      toast.error('Failed to update profile', { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {profileInputFields.map((input) => (
        <CustomInput
          key={input.id}
          name={input.name}
          errors={errors}
          label={input.label}
          register={register}
          required={false}
        />
      ))}

      <Flex justify='center'>
        <Button
          htmlType='submit'
          type='primary'
          style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
        >
          Update Profile
        </Button>
      </Flex>
    </form>
  );
};
