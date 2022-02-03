import clsx from 'clsx';

type LinkCardProps = React.ComponentPropsWithoutRef<'div'>;

const LinkCard = ({ className, children, ...rest }: LinkCardProps) => {
  return (
    <div className={clsx('bg-gray-600', className)} {...rest}>
      {children}
    </div>
  );
};

export default LinkCard;
