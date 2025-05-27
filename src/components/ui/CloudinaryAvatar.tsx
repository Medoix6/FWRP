import React from 'react';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { AdvancedImage } from '@cloudinary/react';

interface CloudinaryAvatarProps {
  publicId: string;
  width?: number;
  height?: number;
}

const cld = new Cloudinary({ cloud: { cloudName: 'drig5ndvt' } });

const CloudinaryAvatar: React.FC<CloudinaryAvatarProps> = ({ publicId, width = 500, height = 500 }) => {
  const img = cld
    .image(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));

  return <AdvancedImage cldImg={img} />;
};

export default CloudinaryAvatar;
