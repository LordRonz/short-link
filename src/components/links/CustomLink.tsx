import { clsx } from 'cn';

import UnstyledLink, {
  UnstyledLinkProps,
} from '@/components/links/UnstyledLink';

const CustomLink = ({ children, className, ...rest }: UnstyledLinkProps) => (
  <UnstyledLink
    {...rest}
    className={clsx(
      'animated-underline custom-link inline-flex items-center font-semibold',
      'focus:outline-hidden focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-primary-500',
      'border-dark border-b border-dotted hover:border-black/0',
      className,
    )}
  >
    {children}
  </UnstyledLink>
);

export default CustomLink;
