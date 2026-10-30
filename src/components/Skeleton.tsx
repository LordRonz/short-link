import { clsx } from 'cn';

type SkeletonProps = React.ComponentPropsWithoutRef<'div'>;

const Skeleton = ({ className, ...rest }: SkeletonProps) => {
  return (
    <div className={clsx('bg-gray-400 animate-pulse', className)} {...rest} />
  );
};

export default Skeleton;
