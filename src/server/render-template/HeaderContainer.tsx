import { PropsWithChildren } from 'react';

const HeaderContainer = ({ children }: PropsWithChildren) => (
  <div
    style={{
      width: '100%',
      paddingTop: 16,
      paddingRight: 24,
      paddingLeft: 24,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'end',
    }}
  >
    {children}
  </div>
);

export default HeaderContainer;
