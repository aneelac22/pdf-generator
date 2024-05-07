import { PropsWithChildren } from 'react';

const FooterContainer = ({ children }: PropsWithChildren) => (
  <div
    style={{
      width: '100%',
      paddingLeft: 24,
      paddingRight: 24,
      paddingBottom: 16,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

export default FooterContainer;
