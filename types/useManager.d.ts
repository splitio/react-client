/**
 * 'useManager' is a custom hook that returns the Manager instance from the Split factory.
 * It uses the 'useContext' hook to access the factory at Split context, which is updated by
 * the SplitFactory component.
 *
 * @return A Split Manager instance, or null if used outside the scope of SplitFactory
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#manager}
 */
declare const useManager: () => SplitIO.IManager | null;
export default useManager;
